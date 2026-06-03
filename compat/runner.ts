import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { VM } from "../src/vm";
import { BuiltinRegistry } from "../runtime/BuiltinRegistry";
import { registerBuiltins } from "../builtins/index";

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
  const vm = new VM(registry);

  let passCount = 0;
  let failCount = 0;
  const testResults: { name: string; expected: unknown; actual: unknown; pass: boolean }[] = [];

  const irFiles = readdirSync(join(exportDir, "ir")).filter(f => f.endsWith(".json"));

  for (const irFile of irFiles) {
    const moduleName = irFile.replace(/\.json$/, "");
    const resultsFile = join(exportDir, "tests", `${moduleName}.results.json`);

    if (!existsSync(resultsFile)) {
      console.error(`  Results file not found: ${resultsFile}`);
      continue;
    }

    const ir = loadJSON<{ irVersion: number; module: { body: { routines: { name: string; export: boolean; kind: string; params: unknown[]; body: unknown[] }[] } } }>(join(exportDir, "ir", irFile));
    const results = loadJSON<ResultsFile>(resultsFile);

    vm.loadModule(ir);

    for (const test of results.tests) {
      try {
        const actual = vm.call(test.name);
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
