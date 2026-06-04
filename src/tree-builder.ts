// TreeBuilder — pure function: MetadataModel → TreeNode[]
//
// Transforms the metadata structure into a navigable tree.
// TreeView is a pure projection — no domain logic, no state, no inference.
// The tree mirrors the explicit structure from MetadataModel exactly.

import { MetadataModel } from "../metadata/MetadataModel";
import type { TreeNode, NodeKind } from "./explorer-types";

export function buildTree(metadata: MetadataModel): TreeNode[] {
  const roots: TreeNode[] = [];

  // Catalogs
  if (metadata.catalogs.length > 0) {
    const catalogNodes: TreeNode[] = metadata.catalogs.map(c => entityNode("Catalog." + c.name, c.name, "catalog"));
    roots.push(folderNode("catalogs", "Справочники", catalogNodes));
  }

  // Documents
  if (metadata.documents.length > 0) {
    const docNodes: TreeNode[] = metadata.documents.map(d => entityNode("Document." + d.name, d.name, "document"));
    roots.push(folderNode("documents", "Документы", docNodes));
  }

  // Enumerations
  if (metadata.enumerations.length > 0) {
    const enumNodes: TreeNode[] = metadata.enumerations.map(e => {
      const id = "Enum." + e.name;
      const children: TreeNode[] = [];
      const v2 = metadata.findEnumerationV2(e.name);
      if (v2 && v2.values.length > 0) {
        for (const val of v2.values) {
          children.push({
            id: id + ".Value." + val.name,
            label: val.name,
            kind: "enum_value",
            parentKind: "enumeration",
            metaRef: e.name,
          });
        }
      }
      const node: TreeNode = {
        id,
        label: e.name,
        kind: "entity",
        parentKind: "enumeration",
        metaRef: e.name,
        children: children.length > 0 ? children : undefined,
      };
      return node;
    });
    roots.push(folderNode("enumerations", "Перечисления", enumNodes));
  }

  return roots;
}

function folderNode(id: string, label: string, children: TreeNode[]): TreeNode {
  return { id, label, kind: "folder", children };
}

function entityNode(id: string, label: string, parentKind: "catalog" | "document"): TreeNode {
  const children: TreeNode[] = [];
  children.push({ id: id + ".Attributes", label: "Реквизиты", kind: "folder", parentKind, metaRef: label });
  children.push({ id: id + ".TabularSections", label: "Табличные части", kind: "folder", parentKind, metaRef: label });
  children.push({ id: id + ".Forms", label: "Формы", kind: "folder", parentKind, metaRef: label });
  children.push({ id: id + ".Commands", label: "Команды", kind: "folder", parentKind, metaRef: label });
  return {
    id, label, kind: "entity", parentKind, metaRef: label, children,
  };
}
