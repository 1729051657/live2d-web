import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, "..");
const distDir = resolve(rootDir, "dist");
const demoManifestPath = resolve(rootDir, "assets", "demo", "model-list.json");

await rm(resolve(distDir, "assets"), { recursive: true, force: true });
await rm(resolve(distDir, "demo"), { recursive: true, force: true });

await mkdir(resolve(distDir, "assets"), { recursive: true });
await mkdir(resolve(distDir, "demo", "models"), { recursive: true });

await cp(
  resolve(rootDir, "assets", "runtime", "live2d.min.js"),
  resolve(distDir, "assets", "live2d.min.js")
);

for (const modelName of ["uiharu", "wed_16"]) {
  await cp(
    resolve(rootDir, "assets", "demo", "models", modelName),
    resolve(distDir, "demo", "models", modelName),
    { recursive: true }
  );
}

const demoManifest = JSON.parse(await readFile(demoManifestPath, "utf8"));
await writeFile(
  resolve(distDir, "demo", "model-list.json"),
  `${JSON.stringify(demoManifest, null, 2)}\n`,
  "utf8"
);
