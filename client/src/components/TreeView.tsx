import type { TreeNode } from "../types";

interface Props {
  nodes: TreeNode[];
  selectedId: string | null;
  expanded: Set<string>;
  search: string;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

function iconForKind(kind: string, _parentKind?: string): string {
  switch (kind) {
    case "root": return "📁";
    case "folder": return "📂";
    case "entity": return "📄";
    case "attribute": return "🔤";
    case "tabular": return "📋";
    case "form": return "🖼️";
    case "command": return "⚡";
    case "enum_value": return "🔘";
    default: return "📄";
  }
}

function matchesSearch(node: TreeNode, search: string): boolean {
  if (!search) return true;
  const lower = search.toLowerCase();
  if (node.label.toLowerCase().includes(lower)) return true;
  if (node.children) {
    return node.children.some(c => matchesSearch(c, lower));
  }
  return false;
}

function TreeNodeRow({
  node, depth, selectedId, expanded, search, onSelect, onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  expanded: Set<string>;
  search: string;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const visible = matchesSearch(node, search);

  if (!visible) return null;

  const filteredChildren = node.children?.filter(c => matchesSearch(c, search)) ?? [];

  return (
    <li className="tree-node">
      <div
        className={"tree-row" + (isSelected ? " selected" : "")}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => { onSelect(node.id); onToggle(node.id); }}
      >
        <span className={"chevron" + (hasChildren ? "" : " empty") + (isExpanded ? " expanded" : "")}>
          {hasChildren ? "▶" : ""}
        </span>
        <span className="icon">{iconForKind(node.kind, node.parentKind)}</span>
        <span className="label">{node.label}</span>
      </div>
      {hasChildren && isExpanded && (
        <ul className="tree-list">
          {filteredChildren.map(child => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              search=""
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TreeView(props: Props) {
  return (
    <ul className="tree-list">
      {props.nodes.map(node => (
        <TreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          selectedId={props.selectedId}
          expanded={props.expanded}
          search={props.search}
          onSelect={props.onSelect}
          onToggle={props.onToggle}
        />
      ))}
    </ul>
  );
}
