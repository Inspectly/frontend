const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const sharedRoot = path.resolve(monorepoRoot, "packages/shared");

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo root so the shared package's files are inside a
// single root (avoids metro-file-map "Failed to collapse" on sibling paths).
config.watchFolders = [monorepoRoot];

// Resolve the shared package by alias; resolve all module lookups (including
// the shared package's own deps) from this app's node_modules.
config.resolver.extraNodeModules = {
  "@inspectly/shared": sharedRoot,
};
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = withNativeWind(config, { input: "./global.css" });
