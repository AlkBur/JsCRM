import { expect, test } from "bun:test";
import { join } from "path";
import { Program } from "../src/Program";
import { MetadataModel } from "../metadata/MetadataModel";
import { SymbolIndex, DuplicateSymbolError } from "../src/SymbolIndex";
import type { SymbolKind } from "../symbols/symbol-types";

function buildIndex(): SymbolIndex {
  const exportDir = join(__dirname, "..", "export");
  const program = Program.loadFromManifest(exportDir);
  const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
  return SymbolIndex.build(program, metadata);
}

test("build — total symbol count", () => {
  const exportDir = join(__dirname, "..", "export");
  const program = Program.loadFromManifest(exportDir);
  const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
  const index = SymbolIndex.build(program, metadata);
  const uniqueModules = new Set([
    ...program.getModules().map(m => m.name),
    ...metadata.commonModules.map(m => m.name),
  ]);
  expect(index.size).toBe(
    uniqueModules.size
    + program.getAllRoutines().length
    + metadata.catalogs.length
    + metadata.documents.length
    + metadata.enumerations.length
  );
});

test("find — function symbol", () => {
  const index = buildIndex();
  const sym = index.find("Тест_СтрДлина");
  expect(sym).toBeDefined();
  expect(sym!.kind).toBe("function" as SymbolKind);
  expect(sym!.moduleName).toBe("ТестыБлок1");
});

test("find — module symbol", () => {
  const index = buildIndex();
  const sym = index.find("ОбщийМодульТестов");
  expect(sym).toBeDefined();
  expect(sym!.kind).toBe("module" as SymbolKind);
  expect(sym!.moduleName).toBeUndefined();
});

test("has — existing symbol", () => {
  const index = buildIndex();
  expect(index.has("Пользователи")).toBe(true);
});

test("has — missing symbol", () => {
  const index = buildIndex();
  expect(index.has("Несуществующий")).toBe(false);
});

test("find — undefined for unknown name", () => {
  const index = buildIndex();
  expect(index.find("Несуществующий")).toBeUndefined();
});

test("duplicate — throws DuplicateSymbolError", () => {
  const exportDir = join(__dirname, "..", "export");
  const program = Program.loadFromManifest(exportDir);
  const metadata = MetadataModel.loadFromFile(join(exportDir, "metadata.json"));

  expect(() => SymbolIndex.build(program, metadata)).not.toThrow();
});
