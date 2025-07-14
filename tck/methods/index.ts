import { globSync } from "glob";
import path from "path";

// Require all files in this folder in one module.export

let allMethods: Record<string, string> = {};
globSync(path.join(__dirname, "**/*.ts")).forEach((file) => {
    allMethods = { ...allMethods, ...require(path.resolve(file)) };
});

export default allMethods;
