#!/usr/bin/env node

/**
 * Create Hiero App CLI
 *
 * Scaffolds new Hiero SDK projects with TypeScript support and best practices.
 * Usage: npm create @hiero-ledger/hiero-app@latest my-app
 *        npx @hiero-ledger/create-hiero-app my-app
 */

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import validatePackageName from "validate-npm-package-name";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TemplateConfig {
    name: string;
    description: string;
    directory: string;
}

const templates: Record<string, TemplateConfig> = {
    basic: {
        name: "Basic",
        description:
            "Simple Hiero SDK setup with TypeScript, account operations, and HBAR transfers",
        directory: "basic",
    },
};

interface ProjectOptions {
    projectName: string;
    template: string;
    skipInstall?: boolean;
    packageManager?: "npm" | "yarn" | "pnpm";
    hederaNetwork?: string;
    walletConnectProjectId?: string;
}

async function main() {
    console.log(chalk.cyan.bold("\n🚀 Create Hiero App\n"));

    const program = new Command()
        .name("create-hiero-app")
        .description("Create a new Hiero SDK application")
        .argument("[project-name]", "Name of the project")
        .option("-t, --template <template>", "Template to use (basic)", "basic")
        .option("--skip-install", "Skip package installation", false)
        .option(
            "--pm <package-manager>",
            "Package manager to use (npm, yarn, pnpm)",
            "npm",
        )
        .version("1.0.0")
        .parse();

    const args = program.args;
    const options = program.opts();

    let projectName = args[0];

    // Interactive mode if project name not provided
    if (!projectName) {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "projectName",
                message: "What is your project name?",
                default: "my-hiero-app",
                validate: (input: string) => {
                    const validation = validatePackageName(input);
                    if (validation.validForNewPackages) {
                        return true;
                    }
                    return validation.errors?.[0] || "Invalid package name";
                },
            },
        ]);
        projectName = answers.projectName;
    }

    // Validate project name
    const validation = validatePackageName(projectName);
    if (!validation.validForNewPackages) {
        console.error(
            chalk.red(`\n❌ Invalid project name: ${validation.errors?.[0]}\n`),
        );
        process.exit(1);
    }

    // Select template if not specified
    let template = options.template;
    if (!templates[template]) {
        const templateChoices = Object.entries(templates).map(
            ([key, config]) => ({
                name: `${config.name} - ${config.description}`,
                value: key,
            }),
        );

        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "template",
                message: "Which template would you like to use?",
                choices: templateChoices,
            },
        ]);
        template = answers.template;
    }

    // Select package manager if not specified
    let packageManager = options.pm;
    if (!["npm", "yarn", "pnpm"].includes(packageManager)) {
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "packageManager",
                message: "Which package manager would you like to use?",
                choices: ["npm", "yarn", "pnpm"],
                default: "npm",
            },
        ]);
        packageManager = answers.packageManager;
    }

    // Prompt for Hiero configuration
    console.log(chalk.cyan("\n📋 Hiero Configuration\n"));
    const configAnswers = await inquirer.prompt([
        {
            type: "list",
            name: "hederaNetwork",
            message: "Which Hiero network would you like to use?",
            choices: [
                { name: "Testnet (Recommended for development)", value: "testnet" },
                { name: "Previewnet", value: "previewnet" },
                { name: "Mainnet", value: "mainnet" },
                { name: "Local Node", value: "local-node" },
            ],
            default: "testnet",
        },
        {
            type: "input",
            name: "walletConnectProjectId",
            message: "WalletConnect Project ID (required):",
            validate: (input: string) => {
                if (!input || input.trim().length === 0) {
                    return "WalletConnect Project ID is required. Get one at https://cloud.walletconnect.com/";
                }
                return true;
            },
        },
    ]);

    const projectOptions: ProjectOptions = {
        projectName,
        template,
        skipInstall: options.skipInstall,
        packageManager: packageManager as "npm" | "yarn" | "pnpm",
        hederaNetwork: configAnswers.hederaNetwork,
        walletConnectProjectId: configAnswers.walletConnectProjectId.trim(),
    };

    await createProject(projectOptions);
}

async function createProject(options: ProjectOptions) {
    const { projectName, template, skipInstall, packageManager } = options;
    const targetDir = path.resolve(process.cwd(), projectName);

    // Check if directory exists
    if (fs.existsSync(targetDir)) {
        console.error(
            chalk.red(`\n❌ Directory ${projectName} already exists!\n`),
        );
        process.exit(1);
    }

    console.log(chalk.blue(`\n📁 Creating project in ${targetDir}\n`));

    const spinner = ora("Creating Vite project with React and TypeScript...").start();

    try {
        // Create Vite project with React and TypeScript template
        spinner.text = "Running npm create vite@latest...";
        
        // Use npm create vite@latest with React + TypeScript template
        // The -- flag passes arguments to the vite create command
        execSync(
            `npm create vite@latest ${projectName} -- --template react-ts`,
            {
                cwd: process.cwd(),
                stdio: "pipe",
            },
        );

        spinner.succeed("Vite project created successfully!");

        // Add Hiero SDK integration files
        spinner.start("Adding Hiero SDK integration...");
        
        const templateDir = path.resolve(
            __dirname,
            "..",
            "templates",
            templates[template].directory,
        );

        // Copy Hiero-specific files
        const hieroFiles = [
            { src: "src/context/WalletContext.tsx", dest: "src/context/WalletContext.tsx" },
            { src: "src/components/WalletButton.tsx", dest: "src/components/WalletButton.tsx" },
            { src: "src/App.tsx", dest: "src/App.tsx" },
            { src: "src/main.tsx", dest: "src/main.tsx" },
            { src: "src/App.css", dest: "src/App.css" },
            { src: "src/index.css", dest: "src/index.css" },
            { src: "env-template.txt", dest: ".env.example" },
        ];

        for (const file of hieroFiles) {
            const srcPath = path.join(templateDir, file.src);
            const destPath = path.join(targetDir, file.dest);
            
            if (fs.existsSync(srcPath)) {
                // Ensure destination directory exists
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                await fs.copy(srcPath, destPath);
            }
        }

        // Update package.json with Hiero SDK dependencies
        const packageJsonPath = path.join(targetDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            const templatePackageJson = await fs.readJson(
                path.join(templateDir, "package.json")
            );
            
            // Merge Hiero SDK dependencies
            packageJson.dependencies = {
                ...packageJson.dependencies,
                ...templatePackageJson.dependencies,
            };
            
            // Update project name
            packageJson.name = projectName;
            packageJson.description = templatePackageJson.description || packageJson.description;
            packageJson.keywords = templatePackageJson.keywords || packageJson.keywords;
            
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }

        spinner.succeed("Hiero SDK integration added!");

        // Create .env file with provided values
        spinner.start("Creating .env file...");
        const envPath = path.join(targetDir, ".env");
        const envContent = `# Hiero Network Configuration
# Options: testnet, previewnet, mainnet, local-node
VITE_HEDERA_NETWORK=${options.hederaNetwork || "testnet"}

# WalletConnect Configuration
# Get a free Project ID at: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=${options.walletConnectProjectId || ""}
`;

        await fs.writeFile(envPath, envContent);
        spinner.succeed(".env file created!");

        // Install dependencies
        if (!skipInstall) {
            spinner.start(`Installing dependencies with ${packageManager}...`);
            try {
                const installCmd =
                    packageManager === "npm"
                        ? "npm install"
                        : packageManager === "yarn"
                        ? "yarn install"
                        : "pnpm install";

                execSync(installCmd, {
                    cwd: targetDir,
                    stdio: "ignore",
                });
                spinner.succeed("Dependencies installed successfully!");
            } catch (error) {
                spinner.warn(
                    "Failed to install dependencies. You can install them manually.",
                );
            }
        }

        // Success message
        console.log(chalk.green.bold("\n✅ Project created successfully!\n"));
        console.log(chalk.cyan("To get started:\n"));
        console.log(chalk.white(`  cd ${projectName}`));

        if (skipInstall) {
            console.log(chalk.white(`  ${packageManager} install`));
        }

        console.log(chalk.white(`  ${packageManager} run dev\n`));
        console.log(chalk.yellow("💡 Your .env file has been created with your configuration!\n"));

        console.log(chalk.gray("📚 Documentation: https://docs.hedera.com/"));
        console.log(chalk.gray("💬 Discord: https://discord.gg/hedera\n"));
    } catch (error) {
        spinner.fail("Failed to create project");
        console.error(chalk.red("\n❌ Error:"), error);

        // Cleanup on failure
        if (fs.existsSync(targetDir)) {
            fs.removeSync(targetDir);
        }
        process.exit(1);
    }
}

// Run the CLI
main().catch((error) => {
    console.error(chalk.red("Unexpected error:"), error);
    process.exit(1);
});
