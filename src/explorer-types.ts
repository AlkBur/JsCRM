// Tree Projection Contract — MetadataIndex → TreeNode mapping.
//
// TreeView is a pure projection of MetadataIndex.
// It does not contain domain logic.
// It does not compute structure.
// It only maps metadata → TreeNode.
//
// Invariant: TreeBuilder is a pure function (no side effects, no state).

export type NodeKind = "root" | "folder" | "entity" | "attribute" | "tabular" | "form" | "command" | "enum_value";

export interface TreeNode {
  id: string;        // stable identity: Catalog.Имя, Document.Имя.Реквизит.ИмяТЧ
  label: string;     // display name
  kind: NodeKind;
  parentKind?: "catalog" | "document" | "enumeration" | "";
  metaRef?: string;  // pointer into MetadataIndex (parent name or entity name)
  children?: TreeNode[];
}
