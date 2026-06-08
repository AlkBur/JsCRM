// TreeBuilder — pure projection: MetadataModel + FormIndex → TreeNode[].
//
// Owns:
//   TreeNode structure, node identity (stable IDs), hierarchy flattening.
//
// Does NOT own:
//   Business logic, metadata interpretation, UI state.
//
// Used by:
//   Server (REST API).

import { MetadataModel } from "../metadata/MetadataModel";
import { FormIndex } from "./forms/FormIndex";
import type { TreeNode } from "./explorer-types";

export function buildTree(metadata: MetadataModel, formIndex?: FormIndex): TreeNode[] {
  const roots: TreeNode[] = [];

  if (metadata.catalogs.length > 0) {
    const catalogNodes: TreeNode[] = metadata.catalogs.map(c =>
      entityNode("Catalog." + c.name, c.name, "catalog", formIndex));
    roots.push(folderNode("catalogs", "Справочники", catalogNodes));
  }

  if (metadata.documents.length > 0) {
    const docNodes: TreeNode[] = metadata.documents.map(d =>
      entityNode("Document." + d.name, d.name, "document", formIndex));
    roots.push(folderNode("documents", "Документы", docNodes));
  }

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
      return { id, label: e.name, kind: "entity", parentKind: "enumeration", metaRef: e.name, children: children.length > 0 ? children : undefined };
    });
    roots.push(folderNode("enumerations", "Перечисления", enumNodes));
  }

  return roots;
}

function folderNode(id: string, label: string, children: TreeNode[]): TreeNode {
  return { id, label, kind: "folder", children };
}

function entityNode(id: string, label: string, parentKind: "catalog" | "document", formIndex?: FormIndex): TreeNode {
  const children: TreeNode[] = [];
  children.push({ id: id + ".Attributes", label: "Реквизиты", kind: "folder", parentKind, metaRef: label });
  children.push({ id: id + ".TabularSections", label: "Табличные части", kind: "folder", parentKind, metaRef: label });

  const formChildren: TreeNode[] = [];
  if (formIndex) {
    const forms = formIndex.getFormsForObject(label);
    for (const f of forms) {
      formChildren.push({
        id: id + ".Forms." + f.form.name,
        label: f.form.synonym || f.form.name,
        kind: "form",
        parentKind,
        metaRef: label,
      });
    }
  }
  children.push({
    id: id + ".Forms",
    label: "Формы",
    kind: "folder",
    parentKind,
    metaRef: label,
    children: formChildren.length > 0 ? formChildren : undefined,
  });

  children.push({ id: id + ".Commands", label: "Команды", kind: "folder", parentKind, metaRef: label });
  return { id, label, kind: "entity", parentKind, metaRef: label, children };
}
