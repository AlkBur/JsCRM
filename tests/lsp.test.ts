import { expect, test } from "bun:test";
import { join } from "path";
import { loadWorkspace } from "../src/WorkspaceLoader";
import { handleDefinition } from "../lsp/handlers/definition";
import { handleReferences } from "../lsp/handlers/references";

const exportDir = join(__dirname, "..", "export");

function buildDeps() {
  const workspace = loadWorkspace(exportDir);
  return { program: workspace.program, symbolIndex: workspace.symbolIndex, dependencyGraph: workspace.dependencyGraph, locationIndex: workspace.locationIndex };
}

test("LocationIndex — built from Program", () => {
  const { locationIndex, program } = buildDeps();
  expect(locationIndex.size).toBe(program.getAllRoutines().length);
});

test("LocationIndex — findSymbol returns location", () => {
  const { locationIndex } = buildDeps();
  const loc = locationIndex.findSymbol("Тест_СтрДлина");
  expect(loc).not.toBeNull();
  expect(loc!.uri).toContain("CommonModule.ТестыБлок1.json");
  expect(loc!.range.start).toEqual({ line: 0, character: 0 });
});

test("LocationIndex — unknown symbol returns null", () => {
  const { locationIndex } = buildDeps();
  expect(locationIndex.findSymbol("Несуществующая")).toBeNull();
});

test("handleDefinition — index-only returns null without loc data", () => {
  const { locationIndex } = buildDeps();
  const result = handleDefinition(
    {
      textDocument: { uri: "file:///CommonModule.ТестыБлок1.json" },
      position: { line: 0, character: 0 },
    },
    locationIndex,
  );
  // Without meta.loc in IR, position-to-symbol resolution is impossible.
  // This is correct index-only behavior: null = "cannot determine symbol".
  expect(result).toBeNull();
});

test("handleDefinition — unknown module returns null", () => {
  const { locationIndex } = buildDeps();
  const result = handleDefinition(
    {
      textDocument: { uri: "file:///CommonModule.Неизвестный.json" },
      position: { line: 5, character: 10 },
    },
    locationIndex,
  );
  expect(result).toBeNull();
});

test("handleReferences — index-only returns empty without loc data", () => {
  const { dependencyGraph, locationIndex } = buildDeps();
  const result = handleReferences(
    {
      textDocument: { uri: "file:///CommonModule.ТестыБлок1.json" },
      position: { line: 0, character: 0 },
    },
    dependencyGraph,
    locationIndex,
  );
  expect(result).toEqual([]);
});

test("LocationIndex — all routines have entries", () => {
  const { locationIndex, program } = buildDeps();
  for (const ri of program.getAllRoutines()) {
    const loc = locationIndex.findSymbol(ri.routine.name);
    expect(loc).not.toBeNull();
    expect(loc!.uri).toContain(
      `CommonModule.${ri.moduleName}.json`,
    );
  }
});

test("SymbolIndex — space is set correctly", () => {
  const { symbolIndex } = buildDeps();
  const func = symbolIndex.find("Тест_Арифметика");
  expect(func).toBeDefined();
  expect(func!.space).toBe("runtime");

  const catalog = symbolIndex.find("Контрагенты");
  expect(catalog).toBeDefined();
  expect(catalog!.space).toBe("metadata");

  const module = symbolIndex.find("ТестыБлок1");
  expect(module).toBeDefined();
  expect(module!.space).toBe("runtime");
});
