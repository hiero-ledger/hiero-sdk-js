import "dotenv/config";
import axios from "axios";
import { Octokit } from "@octokit/rest";
import { posix } from "path";
import axiosRetry from "axios-retry";

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const REPO_OWNER = "hiero-ledger";
const REPO_NAME = "hiero-sdk-js";
const BRANCH = "main";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const brokenLinks = [];

// Status code → description map
const STATUS_DESCRIPTIONS = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
};

const excludedLinks = ["http://localhost:3000"];

// Get all .md files in the repo recursively
async function getMarkdownFiles(path = "") {
    const response = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
    });

    const files = [];

    for (const item of response.data) {
        if (item.type === "file" && item.name.endsWith(".md")) {
            files.push({
                download_url: item.download_url,
                repo_path: item.path,
            });
        } else if (item.type === "dir") {
            const nestedFiles = await getMarkdownFiles(item.path);
            files.push(...nestedFiles);
        }
    }

    return files;
}

// Extract markdown links
function extractLinks(markdown) {
    const regex = /\[.*?\]\((.*?)\)/g;
    const links = new Set();
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        const link = match[1];
        if (!link.startsWith("mailto:")) {
            links.add(link);
        }
    }
    return [...links];
}

// Resolve relative links to GitHub blob URL
function resolveRelativeLink(repoPath, relLink) {
    const baseDir = posix.dirname(repoPath);
    const normalizedPath = posix.normalize(posix.join(baseDir, relLink));
    return `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${BRANCH}/${normalizedPath}`;
}

// Check if a link works
async function checkLink(url) {
    try {
        const res = await axios.head(url, {
            timeout: 20000,
            validateStatus: () => true,
        });
        if (res.status >= 400) {
            const reason = STATUS_DESCRIPTIONS[res.status] || "Unknown Error";

            if (!excludedLinks.includes(url)) {
                brokenLinks.push({ url, status: res.status, reason });
            }
        }
    } catch (err) {
        brokenLinks.push({
            url,
            status: "Request failed",
            reason: err.message,
        });
    }
}

// Main
(async () => {
    console.log(
        `🔍 Crawling markdown files in ${REPO_OWNER}/${REPO_NAME}...\n`,
    );

    let mdFiles = [];
    try {
        mdFiles = await getMarkdownFiles();
    } catch (err) {
        console.error("❌ Failed to fetch markdown files:", err.message);
        process.exit(1);
    }

    const allLinks = await getMarkdownLinks(mdFiles);

    console.log(`\n🔗 Found ${allLinks.size} unique links. Checking...\n`);

    for (const link of allLinks) {
        await checkLink(link);
    }

    if (brokenLinks.length > 0) {
        console.log("\n❌ Broken links found:");
        for (const link of brokenLinks) {
            console.log(`- ${link.url} (${link.status})`);
        }
        process.exit(1);
    }
})();

async function getMarkdownLinks(mdFiles) {
    const result = new Set();

    for (const { download_url, repo_path } of mdFiles) {
        try {
            const res = await axios.get(download_url, { timeout: 15000 });
            const links = extractLinks(res.data);
            for (const link of links) {
                if (link.startsWith("http")) {
                    result.add(link);
                } else if (!link.startsWith("#")) {
                    result.add(resolveRelativeLink(repo_path, link));
                }
            }
        } catch (err) {
            console.error(`[FAILED TO LOAD MD] ${download_url}`);
        }
    }

    return result;
}
