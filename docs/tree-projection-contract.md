# Tree Projection Contract

## Определение

TreeView — чистая проекция MetadataIndex. Она не содержит доменной логики,
не вычисляет структуру, не интерпретирует метаданные. Единственная
ответственность — отображение существующей иерархии метаданных в виде дерева.

## TreeNode

```ts
interface TreeNode {
  id: string;        // Catalog.Имя, Document.Имя.Реквизит
  label: string;
  kind: "root" | "folder" | "entity" | "attribute" | "tabular" | "form" | "command" | "enum_value";
  parentKind?: "catalog" | "document" | "enumeration" | "";
  metaRef?: string;
  children?: TreeNode[];
}
```

## Node identity contract

```
Catalog.Организации
Document.ЗаказКлиента
Enum.ТипДоговора
Catalog.Организации.Реквизит.ИНН
Catalog.Организации.ТабличныеЧасти.Товары
```

## Правила

- `TreeBuilder` — чистая функция без состояния и побочных эффектов
- `TreeNode.id` = стабильный составной ID, он же будет мостом к LSP bridge
- Дерево не содержит доменной логики — только отображение metadata → TreeNode
- React — только dumb renderer, без интерпретации структуры
- Источник структуры — MetadataIndex, источник имён — SymbolIndex (через MetadataModel)

## State model (UI only)

```ts
interface ExplorerUIState {
  selectedNodeId: string | null;
  expandedNodes: Set<string>;
  searchFilter: string;
}
```

## Rendering model

UI rendering is client-side only (CSR). Server provides data exclusively via JSON API:
- Index Layer data
- LSP responses
- optional query endpoints

Server MUST NOT render UI structure (no SSR). SSR would duplicate the Index Layer
and create a second model of tree structure, which violates the single-source-of-truth
principle. SSR may be reconsidered at Phase 9+ (Web IDE with 100k+ node configs,
multi-user, or cloud IDE scenarios), but is explicitly excluded for Explorer v1
and LSP Phase 8.x.

## Projection filtering

Projection layers may:

- filter incomplete or invalid entities;
- group entities;
- reshape data for presentation.

Projection layers must not:

- mutate source models;
- infer semantics;
- become a source of truth.

## Error Handling Policy

Projection layers may degrade gracefully.
Execution layers must fail fast.

Invalid or incomplete source data may be filtered when building projections,
but execution components (VM, runtime, builtins) must never silently ignore
errors or substitute missing behavior.
