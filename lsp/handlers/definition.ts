// textDocument/definition handler.
//
// Index-only: no IR traversal. Serves from precomputed indexes only.
// Without meta.loc in IR, position-to-symbol resolution is not possible.
// Handler returns null for unresolvable positions.

import type { LocationIndex, LSPLocation } from "../../src/LocationIndex";

interface DefinitionParams {
  textDocument: { uri: string };
  position: { line: number; character: number };
}

function resolveModuleName(uri: string): string | null {
  const match = uri.match(/CommonModule\.(.+)\.json$/);
  return match ? match[1] : null;
}

export function handleDefinition(
  params: unknown,
  locationIndex: LocationIndex,
): LSPLocation | null {
  const p = params as DefinitionParams;
  const moduleName = resolveModuleName(p.textDocument.uri);
  if (!moduleName) return null;

  // Position-to-symbol resolution requires meta.loc in IR nodes.
  // Without it, we cannot determine which symbol the cursor is on.
  // Return null — LSP client will show "no definition found".
  return null;
}
