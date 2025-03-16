import glob from "glob";
import path from "path";

// Require all files in this folder in one module.export

let allMethods: Record<string, string> = {};
glob.sync(path.join(__dirname, "**/*.ts")).forEach((file) => {
    allMethods = { ...allMethods, ...require(path.resolve(file)) };
});

export default allMethods;
