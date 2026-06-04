import { useState, useEffect } from "react";
import type { TreeNode } from "./types";
import { fetchTree, fetchNode } from "./api";
import TreeView from "./components/TreeView/TreeView";
import DetailPanel from "./components/DetailPanel/DetailPanel";
import Breadcrumb from "./components/Breadcrumb/Breadcrumb";
import SearchBar from "./components/SearchBar/SearchBar";
import "./styles/app.css";

export default function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [nodeDetail, setNodeDetail] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTree().then(data => {
      setTree(data);
      setExpanded(new Set(["catalogs", "documents", "enumerations"]));
      setLoading(false);
    });
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    fetchNode(id).then(setNodeDetail).catch(() => setNodeDetail(null));
  };

  const handleToggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSearchChange = (q: string) => setSearch(q);

  if (loading) return <div className="app"><div className="loading">Загрузка...</div></div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="title">JsCRM Explorer</h1>
        <SearchBar value={search} onChange={handleSearchChange} />
        <nav className="tree-container">
          <TreeView
            nodes={tree}
            selectedId={selectedId}
            expanded={expanded}
            search={search}
            onSelect={handleSelect}
            onToggle={handleToggle}
          />
        </nav>
      </aside>
      <main className="main">
        {selectedId && <Breadcrumb nodeId={selectedId} />}
        <DetailPanel nodeId={selectedId} data={nodeDetail} />
      </main>
    </div>
  );
}
