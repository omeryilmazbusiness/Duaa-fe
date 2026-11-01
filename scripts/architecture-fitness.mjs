#!/usr/bin/env node
/**
 * Import-boundary fitness: domain is pure, application depends only on domain,
 * infrastructure implements ports, presentation may compose all layers.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const failures = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) acc.push(full);
  }
  return acc;
}

function importsOf(file) {
  const src = readFileSync(file, "utf8");
  const hits = [];
  const re = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) hits.push(m[1]);
  return hits;
}

function layerOf(file) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const top = rel.split("/")[0];
  return top;
}

const forbidden = {
  domain: new Set(["application", "infrastructure", "components", "hooks", "providers", "app", "lib"]),
  application: new Set(["infrastructure", "components", "hooks", "providers", "app", "lib"]),
  infrastructure: new Set(["components", "hooks", "providers", "app"]),
};

for (const file of walk(root)) {
  const layer = layerOf(file);
  const banned = forbidden[layer];
  if (!banned) continue;
  for (const spec of importsOf(file)) {
    if (!spec.startsWith("@/")) continue;
    const target = spec.slice(2).split("/")[0];
    if (banned.has(target)) {
      failures.push(`${relative(root, file)} imports ${spec} (layer ${layer} cannot depend on ${target})`);
    }
  }
}

if (failures.length) {
  console.error("architecture fitness FAILED\n" + failures.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}

console.log("architecture fitness OK — domain/application/infrastructure boundaries hold");
