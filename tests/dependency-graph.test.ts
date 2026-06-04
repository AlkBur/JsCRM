import { expect, test } from "bun:test";
import { join } from "path";
import { Program } from "../src/Program";
import { DependencyGraph } from "../src/DependencyGraph";

function buildGraph(): DependencyGraph {
  const exportDir = join(__dirname, "..", "export");
  const program = Program.loadFromManifest(exportDir);
  return DependencyGraph.build(program);
}

test("build — total nodes", () => {
  const graph = buildGraph();
  expect(graph.getAllNodes().length).toBe(42);
});

test("getCallees — Тест_Функция calls Удвоить", () => {
  const graph = buildGraph();
  const callees = graph.getCallees("Тест_Функция");
  expect(callees).toContain("Удвоить");
  expect(callees.length).toBe(1);
});

test("getCallees — Тест_Процедура calls ВызватьПроцедуруТест", () => {
  const graph = buildGraph();
  const callees = graph.getCallees("Тест_Процедура");
  expect(callees).toContain("ВызватьПроцедуруТест");
  expect(callees.length).toBe(1);
});

test("getCallers — Удвоить called by Тест_Функция", () => {
  const graph = buildGraph();
  const callers = graph.getCallers("Удвоить");
  expect(callers).toContain("Тест_Функция");
  expect(callers.length).toBe(1);
});

test("getCallers — ВызватьПроцедуруТест called by Тест_Процедура", () => {
  const graph = buildGraph();
  const callers = graph.getCallers("ВызватьПроцедуруТест");
  expect(callers).toContain("Тест_Процедура");
  expect(callers.length).toBe(1);
});

test("has — routine in graph", () => {
  const graph = buildGraph();
  expect(graph.has("Тест_СтрДлина")).toBe(true);
  expect(graph.has("Удвоить")).toBe(true);
});

test("has — builtin excluded", () => {
  const graph = buildGraph();
  expect(graph.has("СтрДлина")).toBe(false);
  expect(graph.has("Дата")).toBe(false);
  expect(graph.has("Лев")).toBe(false);
});

test("has — unknown name", () => {
  const graph = buildGraph();
  expect(graph.has("НесуществующаяФункция")).toBe(false);
});

test("getAllNodes — contains all routines", () => {
  const graph = buildGraph();
  const nodes = graph.getAllNodes();
  expect(nodes).toContain("Тест_СтрДлина");
  expect(nodes).toContain("ВызватьПроцедуруТест");
  expect(nodes).toContain("Удвоить");
});

test("getCallees — routine with no calls returns empty array", () => {
  const graph = buildGraph();
  const callees = graph.getCallees("Тест_Арифметика");
  expect(callees).toBeDefined();
  expect(callees.length).toBe(0);
});

test("getCallers — routine with no callers returns empty array", () => {
  const graph = buildGraph();
  const callers = graph.getCallers("Тест_СтрДлина");
  expect(callers).toBeDefined();
  expect(callers.length).toBe(0);
});

test("findUnused — default excludes tests and entrypoints", () => {
  const graph = buildGraph();
  const unused = graph.findUnused();
  // With default options: Тест_* (40) + exported (26) are excluded.
  // Only ВызватьПроцедуруТест remains — but it has callers.
  expect(unused.length).toBe(0);
});

test("findUnused — include all finds Тест_ routines", () => {
  const graph = buildGraph();
  const unused = graph.findUnused({ includeTests: true, includeEntrypoints: true });
  // All Тест_* routines have no callers
  expect(unused.length).toBeGreaterThan(0);
  for (const name of unused) {
    expect(name.startsWith("Тест_")).toBe(true);
  }
});

test("findUnused — empty array for unknown", () => {
  const graph = buildGraph();
  expect(graph.getCallers("Неизвестно")).toEqual([]);
  expect(graph.getCallees("Неизвестно")).toEqual([]);
});
