import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

assert.equal(manifest.optionalDependencies?.["node-llama-cpp"], undefined);
assert.equal(manifest.peerDependencies?.["node-llama-cpp"], "^3.19.1");
assert.equal(manifest.peerDependenciesMeta?.["node-llama-cpp"]?.optional, true);
console.log("install contract: native local embedding stays opt-in");
