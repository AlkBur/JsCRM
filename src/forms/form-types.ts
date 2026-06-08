// FormProjection types — raw form JSON data model (jscrm.form.v1).
//
// One concept per discriminants of FormLayoutElement:
// full list defined here; each variant is a separate interface.

export interface FormDocument {
  schema: string;
  id: string;
  owner: FormOwner;
  attributes: FormAttribute[];
  commands: FormCommand[];
  events: FormEvent[];
  mainAttribute?: string;
  form: FormMeta;
  layout: FormLayoutElement;
}

export interface FormOwner {
  kind: string;
  name: string;
}

export interface FormAttribute {
  name: string;
  type: FormAttributeType;
  main?: boolean;
  savedData?: boolean;
}

export type FormAttributeType =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "date" }
  | { kind: "ref"; target: string }
  | { kind: "enum"; target: string }
  | { kind: "tabular"; target: string }
  | { kind: "undefined" };

export interface FormCommand {
  name: string;
  title?: string;
  handler: string;
  tooltip?: string;
}

export interface FormEvent {
  source: string;
  event: string;
  handler: string;
}

export interface FormMeta {
  name: string;
  synonym?: string;
  type: "managed" | "ordinary";
  uuid: string;
}

export type FormLayoutElement =
  | FormLayoutGroup
  | FormField
  | FormButton
  | FormLabel
  | FormSpacer
  | FormCheckbox
  | FormSelect
  | FormTable
  | FormTabs
  | FormTab
  | FormCommandBar;

export interface FormLayoutBase {
  id: number;
  name: string;
  title?: string;
  visible?: boolean;
  enabled?: boolean;
}

export interface FormLayoutGroup extends FormLayoutBase {
  view: "group";
  elements: FormLayoutElement[];
  layout?: "horizontal" | "vertical";
  showTitle?: boolean;
}

export interface FormField extends FormLayoutBase {
  view: "input";
  dataPath: string;
  readonly?: boolean;
}

export interface FormButton extends FormLayoutBase {
  view: "button";
}

export interface FormLabel extends FormLayoutBase {
  view: "label";
  text?: string;
}

export interface FormSpacer extends FormLayoutBase {
  view: "spacer";
}

export interface FormCheckbox extends FormLayoutBase {
  view: "checkbox";
  dataPath: string;
}

export interface FormSelect extends FormLayoutBase {
  view: "select";
  dataPath: string;
}

export interface FormTable extends FormLayoutBase {
  view: "table";
  dataPath: string;
  columns?: FormTableColumn[];
}

export interface FormTableColumn {
  name: string;
  title?: string;
  dataPath: string;
}

export interface FormTabs extends FormLayoutBase {
  view: "tabs";
  elements: FormTab[];
}

export interface FormTab extends FormLayoutBase {
  view: "tab";
  elements: FormLayoutElement[];
}

export interface FormCommandBar extends FormLayoutBase {
  view: "commandBar";
  elements: FormLayoutElement[];
}
