// FormIndex — immutable derived projection over form export files.
//
// Owns:
//   Loading, projecting, and indexing exported form JSON files.
//
// Does NOT own:
//   Metadata, program, or any execution state.

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { FormDocument } from "./form-types";
import { buildFormProjection } from "./form-projection";

export class FormIndex {
  private readonly forms: Map<string, Map<string, FormDocument>> = new Map();

  constructor(formsDir: string) {
    this.load(formsDir);
  }

  private load(formsDir: string): void {
    const kinds = readdirSync(formsDir, { withFileTypes: true });
    for (const kind of kinds) {
      if (!kind.isDirectory()) continue;
      const kindPath = join(formsDir, kind.name);
      const objects = readdirSync(kindPath, { withFileTypes: true });
      for (const obj of objects) {
        if (!obj.isDirectory()) continue;
        const objPath = join(kindPath, obj.name);
        const files = readdirSync(objPath);
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          const raw = readFileSync(join(objPath, file), "utf-8");
          const doc: FormDocument = JSON.parse(raw);
          const projected = buildFormProjection(doc);
          const objectName = doc.owner.name;
          if (!this.forms.has(objectName)) {
            this.forms.set(objectName, new Map());
          }
          this.forms.get(objectName)!.set(doc.form.name, projected);
        }
      }
    }
  }

  get(objectName: string, formName: string): FormDocument | undefined {
    return this.forms.get(objectName)?.get(formName);
  }

  getFormsForObject(objectName: string): readonly FormDocument[] {
    const map = this.forms.get(objectName);
    return map ? Array.from(map.values()) : [];
  }

  getAllForms(): readonly FormDocument[] {
    const result: FormDocument[] = [];
    for (const map of this.forms.values()) {
      for (const doc of map.values()) {
        result.push(doc);
      }
    }
    return result;
  }
}
