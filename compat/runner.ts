// Compatibility Runner — loads IR modules via Program, executes via VM,
// and diffs results against 1C reference results.
//
// This is the primary regression detection tool.
// Tests are driven by export/tests/*.results.json, not by IR file names.
//
// Responsibility: validate that VM produces correct 1C-compatible output.
// Non-responsibility: unit testing, IR schema validation, module loading.

import { readdirSync } from "fs";
import { join } from "path";
import { VM } from "../src/vm/index";
import type { Value } from "../runtime/types";
import { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import { registerBuiltins } from "../builtins/index";
import { Program } from "../src/Program";

interface TestResult {
  name: string;
  result: unknown;
}

interface ResultsFile {
  module: string;
  tests: TestResult[];
}

function loadJSON<T>(file: string): T {
  return JSON.parse(require("fs").readFileSync(file, "utf8")) as T;
}

function normalizeResult(value: Value): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }
  return a === b;
}

export function runCompatibilityTests(exportDir: string): { pass: number; fail: number; results: { name: string; expected: unknown; actual: unknown; pass: boolean }[] } {
  const registry = new BuiltinRegistry();
  registerBuiltins(registry);

  const program = Program.loadFromManifest(exportDir);
  const vm = new VM(program, registry);

  let passCount = 0;
  let failCount = 0;
  const testResults: { name: string; expected: unknown; actual: unknown; pass: boolean }[] = [];

  const resultFiles = readdirSync(join(exportDir, "tests")).filter(f => f.endsWith(".results.json"));

  for (const rf of resultFiles) {
    const results = loadJSON<ResultsFile>(join(exportDir, "tests", rf));

    for (const test of results.tests) {
      try {
        const actual = normalizeResult(vm.call(test.name));
        const pass = deepEqual(actual, test.result);
        testResults.push({ name: test.name, expected: test.result, actual, pass });
        if (pass) passCount++;
        else failCount++;
      } catch (e) {
        testResults.push({ name: test.name, expected: test.result, actual: String(e), pass: false });
        failCount++;
      }
    }
  }

  return { pass: passCount, fail: failCount, results: testResults };
}

if (import.meta.main) {
  const exportDir = join(__dirname, "..", "export");
  console.log("Running compatibility tests...\n");
  const result = runCompatibilityTests(exportDir);
  console.log(`\nResults: ${result.pass} passed, ${result.fail} failed`);
  for (const t of result.results) {
    const icon = t.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${t.name}: ${JSON.stringify(t.expected)}`);
    if (!t.pass) {
      console.log(`        expected: ${JSON.stringify(t.expected)}`);
      console.log(`        actual:   ${JSON.stringify(t.actual)}`);
    }
  }
  process.exit(result.fail > 0 ? 1 : 0);
}
