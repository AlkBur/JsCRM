// textDocument/references handler.
//
// Index-only: no IR traversal. Serves from precomputed indexes only.
// Without meta.loc in IR, position-to-symbol resolution is not possible.
// Handler returns empty array for unresolvable positions.

import type { DependencyGraph } from "../../src/DependencyGraph";
import type { LocationIndex, LSPLocation } from "../../src/LocationIndex";

interface ReferenceParams {
  textDocument: { uri: string };
  position: { line: number; character: number };
  context?: { includeDeclaration: boolean };
}

function resolveModuleName(uri: string): string | null {
  const match = uri.match(/CommonModule\.(.+)\.json$/);
  return match ? (match[1] ?? null) : null;
}

export function handleReferences(
  params: unknown,
  _dependencyGraph: DependencyGraph,
  _locationIndex: LocationIndex,
): LSPLocation[] {
  const p = params as ReferenceParams;
  const moduleName = resolveModuleName(p.textDocument.uri);
  if (!moduleName) return [];

  // Position-to-symbol resolution requires meta.loc in IR nodes.
  // Without it, we cannot determine which symbol the cursor is on.
  return [];
}
