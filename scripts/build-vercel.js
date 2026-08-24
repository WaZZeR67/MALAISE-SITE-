const fs = require("fs");
const path = require("path");

const root = process.cwd();
const sourceDir = path.join(root, "outputs");
const targetDir = path.join(root, "dist");
const allowedFiles = new Set([
  "index.html",
  "drone.html",
  "configurateur-faconnage.html",
  "merci.html",
  "robots.txt",
  "sitemap.xml"
]);

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

for (const file of allowedFiles) {
  fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
}

copyDir(path.join(sourceDir, "assets"), path.join(targetDir, "assets"));

console.log("Vercel build ready in dist/");
