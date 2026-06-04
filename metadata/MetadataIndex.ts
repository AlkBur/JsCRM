// MetadataIndex — searchable index over the detailed structure of Metadata v2.
//
// Provides fast lookup of attributes, tabular sections, forms, and commands
// by parent object name. Complements SymbolIndex (which covers top-level names)
// without mixing granularity levels.
//
// Responsibility: provide attribute-level queries over metadata.
// Non-responsibility: top-level symbol search, routine resolution, dependency graph.
//
// Invariant: MetadataIndex is immutable after build().

import { MetadataModel } from "./MetadataModel";
import type {
  AttributeV2,
  TabularSectionV2,
  FormV2,
  CommandV2,
} from "./metadata-types-v2";

export interface AttributeInfo {
  readonly parentName: string;
  readonly parentKind: "catalog" | "document";
  readonly attribute: AttributeV2;
}

export interface TabularSectionInfo {
  readonly parentName: string;
  readonly parentKind: "catalog" | "document";
  readonly section: TabularSectionV2;
}

export interface FormInfo {
  readonly parentName: string;
  readonly parentKind: "catalog" | "document";
  readonly form: FormV2;
}

export interface CommandInfo {
  readonly parentName: string;
  readonly parentKind: "catalog" | "document";
  readonly command: CommandV2;
}

export class MetadataIndex {
  private readonly attributes: readonly AttributeInfo[];
  private readonly tabularSections: readonly TabularSectionInfo[];
  private readonly forms: readonly FormInfo[];
  private readonly commands: readonly CommandInfo[];

  private constructor(
    attributes: AttributeInfo[],
    tabularSections: TabularSectionInfo[],
    forms: FormInfo[],
    commands: CommandInfo[],
  ) {
    this.attributes = Object.freeze(attributes);
    this.tabularSections = Object.freeze(tabularSections);
    this.forms = Object.freeze(forms);
    this.commands = Object.freeze(commands);
  }

  static build(model: MetadataModel): MetadataIndex {
    const attrs: AttributeInfo[] = [];
    const tabs: TabularSectionInfo[] = [];
    const forms: FormInfo[] = [];
    const cmds: CommandInfo[] = [];

    const pushObject = (name: string, kind: "catalog" | "document") => {
      const obj = kind === "catalog" ? model.findCatalogV2(name) : model.findDocumentV2(name);
      if (!obj) return;

      for (const a of obj.attributes) {
        attrs.push({ parentName: name, parentKind: kind, attribute: a });
      }
      for (const ts of obj.tabularSections) {
        tabs.push({ parentName: name, parentKind: kind, section: ts });
        for (const a of ts.attributes) {
          attrs.push({ parentName: `${name}.${ts.name}`, parentKind: kind, attribute: a });
        }
      }
      for (const f of obj.forms) {
        forms.push({ parentName: name, parentKind: kind, form: f });
      }
      for (const c of obj.commands) {
        cmds.push({ parentName: name, parentKind: kind, command: c });
      }
    };

    for (const c of model.catalogs) {
      pushObject(c.name, "catalog");
    }
    for (const d of model.documents) {
      pushObject(d.name, "document");
    }

    return new MetadataIndex(attrs, tabs, forms, cmds);
  }

  getAttributes(parentName?: string): readonly AttributeInfo[] {
    if (!parentName) return this.attributes;
    return this.attributes.filter(a => a.parentName === parentName);
  }

  getTabularSections(parentName?: string): readonly TabularSectionInfo[] {
    if (!parentName) return this.tabularSections;
    return this.tabularSections.filter(t => t.parentName === parentName);
  }

  getForms(parentName?: string): readonly FormInfo[] {
    if (!parentName) return this.forms;
    return this.forms.filter(f => f.parentName === parentName);
  }

  getCommands(parentName?: string): readonly CommandInfo[] {
    if (!parentName) return this.commands;
    return this.commands.filter(c => c.parentName === parentName);
  }

  findAttribute(name: string, parentName: string): AttributeInfo | undefined {
    return this.attributes.find(a => a.attribute.name === name && a.parentName === parentName);
  }

  get attributeCount(): number {
    return this.attributes.length;
  }

  get tabularSectionCount(): number {
    return this.tabularSections.length;
  }

  get formCount(): number {
    return this.forms.length;
  }

  get commandCount(): number {
    return this.commands.length;
  }
}
