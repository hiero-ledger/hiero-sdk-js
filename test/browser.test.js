import { test, expect } from "@playwright/test";

test("can execute @hashgraph/sdk within browser", async function ({ page }) {
    page.on("pageerror", async (message) => {
        throw new Error(message);
    });

    await page.goto("http://localhost:9001/");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Added timeout to wait for tests to load
    await page.waitForSelector(".test", { timeout: 10000 });

    const tests = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".test"))
            .map((test) => {
                const error = test.querySelector(".error");
                return {
                    name: [].reduce.call(test.querySelector("h2").childNodes, function(a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, ''),
                    error: error != null ? error.innerText.trim() : null,
                };
            });
    });

    expect(tests.length).toBeGreaterThan(0);
    for (const t of tests) {
        expect(t.error).toBeNull();
    }
});
