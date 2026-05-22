const fs = require("node:fs");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const packagePath = path.join(appRoot, "package.json");
const expoConfigPath = path.join(appRoot, "app.json");
const increment = process.argv[2] || "patch";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    throw new Error(`Expected a major.minor.patch version, received "${version}".`);
  }

  return match.slice(1).map(Number);
}

function nextVersion(version, bump) {
  const [major, minor, patch] = parseVersion(version);

  if (/^\d+\.\d+\.\d+$/.test(bump)) {
    return bump;
  }

  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(
        `Unsupported bump "${bump}". Use major, minor, patch, or an explicit version.`,
      );
  }
}

const packageJson = readJson(packagePath);
const expoConfig = readJson(expoConfigPath);
const version = nextVersion(packageJson.version, increment);

packageJson.version = version;
expoConfig.expo.version = version;

writeJson(packagePath, packageJson);
writeJson(expoConfigPath, expoConfig);

console.log(`Bumped version to ${version}.`);
