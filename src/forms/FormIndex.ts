// FormIndex — immutable derived projection over form export files.
//
// Owns:
//   Loading, projecting, and indexing exported form JSON files.
//
// Does NOT own:
//   Metadata, program, or any execution state.

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { FormDocument, IndexedFormDocument } from "./form-types";
import { buildFormProjection } from "./form-projection";

export class FormIndex {
  private readonly index = new Map<string, Map<string, IndexedFormDocument>>();

  constructor(formsDir: string) {
    this.load(formsDir);
  }

  private load(formsDir: string): void {
    const kinds = readdirSync(formsDir, { withFileTypes: true });
    for (const kind of kinds) {
      if (!kind.isDirectory()) continue;
      const kindPath = join(formsDir, kind.name);

      if (kind.name === "System") {
        const files = readdirSync(kindPath);
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          const filePath = join(kindPath, file);
          const raw = readFileSync(filePath, "utf-8");
          const doc: FormDocument = JSON.parse(raw);
          const projected = buildFormProjection(doc);
          const formName = file.replace(/\.json$/, "");
          const indexed: IndexedFormDocument = {
            kind: "System",
            objectName: null,
            formName,
            path: filePath,
            document: projected,
          };
          const key = "System";
          if (!this.index.has(key)) {
            this.index.set(key, new Map());
          }
          this.index.get(key)!.set(formName, indexed);
        }
        continue;
      }

      const objects = readdirSync(kindPath, { withFileTypes: true });
      for (const obj of objects) {
        if (!obj.isDirectory()) continue;
        const objPath = join(kindPath, obj.name);
        const files = readdirSync(objPath);
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          const filePath = join(objPath, file);
          const raw = readFileSync(filePath, "utf-8");
          const doc: FormDocument = JSON.parse(raw);
          const projected = buildFormProjection(doc);
          const formName = file.replace(/\.json$/, "");
          const indexed: IndexedFormDocument = {
            kind: kind.name,
            objectName: obj.name,
            formName,
            path: filePath,
            document: projected,
          };
          if (!this.index.has(obj.name)) {
            this.index.set(obj.name, new Map());
          }
          this.index.get(obj.name)!.set(formName, indexed);
        }
      }
    }
  }

  get(objectName: string, formName: string): IndexedFormDocument | undefined {
    return this.index.get(objectName)?.get(formName);
  }

  getByPath(path: string): IndexedFormDocument | undefined {
    const parts = path.split(".");
    if (parts.length === 2) {
      return this.index.get(parts[0]!)?.get(parts[1]!);
    }
    if (parts.length === 3) {
      return this.index.get(parts[1]!)?.get(parts[2]!);
    }
    return undefined;
  }

  getFormsForObject(objectName: string): readonly IndexedFormDocument[] {
    const map = this.index.get(objectName);
    return map ? Array.from(map.values()) : [];
  }

  getAllForms(): readonly IndexedFormDocument[] {
    const result: IndexedFormDocument[] = [];
    for (const map of this.index.values()) {
      for (const indexed of map.values()) {
        result.push(indexed);
      }
    }
    return result;
  }
}
