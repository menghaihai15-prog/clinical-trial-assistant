import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const files = ["index.html", "styles.css", "app.js"];

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await cp(path.join(root, file), path.join(dist, file));
}

await cp(path.join(root, "public"), dist, { recursive: true });

const htmlPath = path.join(dist, "index.html");
const html = await readFile(htmlPath, "utf8");
await writeFile(
  htmlPath,
  html
    .replace('href="/icon.svg"', 'href="icon.svg"')
    .replace('href="/site.webmanifest"', 'href="site.webmanifest"'),
  "utf8"
);

console.log(`Built ${path.relative(root, dist)}/`);
