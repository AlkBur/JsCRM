import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { MetadataModel } from "../metadata/MetadataModel";
import { MetadataIndex } from "../metadata/MetadataIndex";
import type { FieldType } from "../metadata/metadata-types-v2";

const exportDir = join(__dirname, "..", "export");

function loadModel(): MetadataModel {
  return MetadataModel.loadFromFile(join(exportDir, "metadata.json"));
}

test("load — version is 2", () => {
  const m = loadModel();
  expect(m.version).toBe("2");
  expect(m.isV2).toBe(true);
});

test("load — top-level counts", () => {
  const m = loadModel();
  expect(m.configurationName).toBe("ТестоваяКонфигурация");
  expect(m.catalogs.length).toBeGreaterThan(0);
  expect(m.documents.length).toBeGreaterThan(0);
  expect(m.enumerations.length).toBeGreaterThan(0);
});

test("findCatalogV2 — returns full v2 data", () => {
  const m = loadModel();
  const cat = m.findCatalogV2("Контрагенты");
  expect(cat).toBeDefined();
  expect(cat!.attributes.length).toBe(3);
  expect(cat!.attributes[0]!.name).toBe("ПолноеНаименование");
  expect(cat!.attributes[0]!.type).toEqual({ kind: "string", length: 100 });
  expect(cat!.forms.length).toBeGreaterThan(0);
});

test("findCatalogV2 — unknown returns undefined", () => {
  const m = loadModel();
  expect(m.findCatalogV2("НеизвестныйСправочник")).toBeUndefined();
});

test("findDocumentV2 — returns full v2 data", () => {
  const m = loadModel();
  const doc = m.findDocumentV2("ЗаказКлиента");
  expect(doc).toBeDefined();
  expect(doc!.attributes.length).toBe(2);
  expect(doc!.tabularSections.length).toBe(1);
  expect(doc!.tabularSections[0]!.name).toBe("Товары");
});

test("findEnumerationV2 — returns values", () => {
  const m = loadModel();
  const en = m.findEnumerationV2("ВидыНоменклатуры");
  expect(en).toBeDefined();
  expect(en!.values.length).toBe(2);
  expect(en!.values[0]!.name).toBe("Товар");
});

test("findEnumerationV2 — empty values array", () => {
  const m = loadModel();
  const en = m.findEnumerationV2("ТипДоговора");
  expect(en).toBeDefined();
  expect(en!.values).toEqual([]);
});

test("attribute — field type discriminated union", () => {
  const m = loadModel();
  const cat = m.findCatalogV2("Контрагенты")!;

  const str = cat.attributes[0]!.type as FieldType;
  expect(str).not.toHaveProperty("kind", "ref");

  const ref = m.findDocumentV2("ЗаказКлиента")!.attributes[0]!.type as FieldType;
  if (typeof ref !== "string" && "kind" in ref) {
    expect(ref.kind).toBe("ref");
    expect((ref as { kind: string; target: string }).target).toContain("Catalog");
  }
});

test("attribute — enum kind is separate from ref", () => {
  const m = loadModel();
  const cat = m.findCatalogV2("Номенклатура")!;
  const enumAttr = cat.attributes[0]!.type as FieldType;
  if (typeof enumAttr !== "string" && "kind" in enumAttr) {
    expect(enumAttr.kind).toBe("enum");
    expect((enumAttr as { kind: string; target: string }).target).toBe("ВидыНоменклатуры");
  }
});

test("MetadataIndex — build and query", () => {
  const m = loadModel();
  const idx = MetadataIndex.build(m);

  expect(idx.attributeCount).toBeGreaterThan(0);
  expect(idx.tabularSectionCount).toBeGreaterThanOrEqual(0);

  const kontrAttrs = idx.getAttributes("Контрагенты");
  expect(kontrAttrs.length).toBe(3);
  expect(kontrAttrs[0]!.parentKind).toBe("catalog");
});

test("MetadataIndex — find by parent", () => {
  const m = loadModel();
  const idx = MetadataIndex.build(m);

  const found = idx.findAttribute("ИНН", "Контрагенты");
  expect(found).toBeDefined();
  expect(found!.attribute.name).toBe("ИНН");

  const missing = idx.findAttribute("ИНН", "Номенклатура");
  expect(missing).toBeUndefined();
});

test("MetadataIndex — tabular section attributes included", () => {
  const m = loadModel();
  const idx = MetadataIndex.build(m);

  const goodsAttrs = idx.getAttributes("ЗаказКлиента.Товары");
  expect(goodsAttrs.length).toBe(4);
  expect(goodsAttrs.some(a => a.attribute.name === "Количество")).toBe(true);
});

test("MetadataIndex — forms and commands", () => {
  const m = loadModel();
  const idx = MetadataIndex.build(m);

  const forms = idx.getForms("Номенклатура");
  expect(forms.length).toBe(5);
  expect(forms.some(f => f.form.name === "ФормаВыбора")).toBe(true);

  const cmds = idx.getCommands("ЗаказКлиента");
  expect(cmds.length).toBe(2);
});
