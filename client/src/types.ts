export type NodeKind = "root" | "folder" | "entity" | "attribute" | "tabular" | "form" | "command" | "enum_value";

export interface TreeNode {
  id: string;
  label: string;
  kind: NodeKind;
  parentKind?: "catalog" | "document" | "enumeration" | "";
  metaRef?: string;
  children?: TreeNode[];
}

export interface AttributeInfo {
  uuid?: string;
  name: string;
  type: FieldType;
  required: boolean;
}

export interface TabularSectionInfo {
  uuid?: string;
  name: string;
  attributes: AttributeInfo[];
}

export interface FormInfo {
  name: string;
  type: "ordinary" | "managed";
}

export interface CommandInfo {
  uuid?: string;
  name: string;
  handler: string;
}

export interface EnumValueInfo {
  uuid: string;
  name: string;
}

export type FieldType =
  | { kind: "string"; length?: number }
  | { kind: "number"; precision?: number; scale?: number }
  | { kind: "date" }
  | { kind: "boolean" }
  | { kind: "ref"; target: string }
  | { kind: "enum"; target: string }
  | { kind: "union"; options: FieldType[] };

// FormProjection types (mirrors src/forms/form-types.ts for client use)
export interface FormDocument {
  schema: string;
  id: string;
  attributes: unknown[];
  commands: unknown[];
  events: unknown[];
  mainAttribute?: string;
  form: { name: string; synonym?: string; type: string; uuid: string };
  layout: FormLayoutElement;
}

export interface ObjectRef {
  id: string;
  label: string;
}

export interface ObjectSnapshot {
  meta: { id: string; object: string };
  values: Record<string, unknown>;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: unknown;
}

export interface FormScreenDto {
  form: FormDocument;
  metadata: unknown;
  object?: { name: string };
}

export type FormLayoutElement =
  | { view: "form" | "group" | "tabs" | "tab" | "commandBar"; id: number; name: string; title?: string; elements: FormLayoutElement[]; layout?: string; showTitle?: boolean; showBorder?: boolean }
  | { view: "input"; id: number; name: string; title?: string; dataPath: string; readonly?: boolean; visible?: boolean; enabled?: boolean }
  | { view: "button"; id: number; name: string; title?: string; visible?: boolean; enabled?: boolean }
  | { view: "label"; id: number; name: string; title?: string; text?: string }
  | { view: "spacer"; id: number; name: string }
  | { view: "checkbox" | "select"; id: number; name: string; title?: string; dataPath: string }
  | { view: "table"; id: number; name: string; title?: string; dataPath: string; columns?: Array<{ name: string; title?: string; dataPath: string }> };
