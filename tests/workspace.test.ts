// Platform Consistency Test.
//
// Validates global invariants across all Workspace components.
// Failure indicates a structural inconsistency in the platform, not a missing feature.
//
// Invariants:
//   - routines === graphNodes (every routine is a graph node)
//   - locations === routines (every routine has a location entry)
//   - runtimeSymbols >= routines (every routine is indexed, plus module symbols)
//   - metadataSymbols === metadataObjects (every metadata object is indexed)
//   - all graph nodes exist in SymbolIndex (runtime space)
//   - every routine is findable in SymbolIndex

import { expect, test } from "bun:test";
import { join } from "path";
import { loadWorkspace } from "../src/WorkspaceLoader";

const exportDir = join(__dirname, "..", "export");

function buildWorkspace() {
  return loadWorkspace(exportDir);
}

test("Workspace loads all components", () => {
  const ws = buildWorkspace();
  expect(ws.program).toBeDefined();
  expect(ws.metadata).toBeDefined();
  expect(ws.symbolIndex).toBeDefined();
  expect(ws.metadataIndex).toBeDefined();
  expect(ws.dependencyGraph).toBeDefined();
  expect(ws.locationIndex).toBeDefined();
  expect(ws.stats).toBeDefined();
});

test("WorkspaceStats — modules > 0", () => {
  expect(buildWorkspace().stats.modules).toBeGreaterThan(0);
});

test("WorkspaceStats — routines === graphNodes", () => {
  const ws = buildWorkspace();
  expect(ws.stats.routines).toBe(ws.stats.graphNodes);
});

test("WorkspaceStats — locations === routines", () => {
  const ws = buildWorkspace();
  expect(ws.stats.locations).toBe(ws.stats.routines);
});

test("WorkspaceStats — runtimeSymbols >= routines (includes module symbols)", () => {
  const ws = buildWorkspace();
  expect(ws.stats.runtimeSymbols).toBeGreaterThanOrEqual(ws.stats.routines);
});

test("WorkspaceStats — metadataSymbols === metadataObjects", () => {
  const ws = buildWorkspace();
  expect(ws.stats.metadataSymbols).toBe(ws.stats.metadataObjects);
});

test("WorkspaceStats — graphEdges >= 0", () => {
  expect(buildWorkspace().stats.graphEdges).toBeGreaterThanOrEqual(0);
});

test("Every graph node exists in SymbolIndex (runtime space)", () => {
  const ws = buildWorkspace();
  for (const node of ws.dependencyGraph.getAllNodes()) {
    const sym = ws.symbolIndex.find(node);
    expect(sym).toBeDefined();
    expect(sym!.space).toBe("runtime");
  }
});

test("Every routine is findable in SymbolIndex", () => {
  const ws = buildWorkspace();
  for (const ri of ws.program.getAllRoutines()) {
    const sym = ws.symbolIndex.find(ri.routine.name);
    expect(sym).not.toBeNull();
  }
});

test("Every routine has a location in LocationIndex", () => {
  const ws = buildWorkspace();
  for (const ri of ws.program.getAllRoutines()) {
    const loc = ws.locationIndex.findSymbol(ri.routine.name);
    expect(loc).not.toBeNull();
  }
});

test("WorkspaceStats — all values are non-negative", () => {
  const s = buildWorkspace().stats;
  expect(s.modules).toBeGreaterThanOrEqual(0);
  expect(s.routines).toBeGreaterThanOrEqual(0);
  expect(s.symbols).toBeGreaterThanOrEqual(0);
  expect(s.runtimeSymbols).toBeGreaterThanOrEqual(0);
  expect(s.metadataSymbols).toBeGreaterThanOrEqual(0);
  expect(s.metadataObjects).toBeGreaterThanOrEqual(0);
  expect(s.attributes).toBeGreaterThanOrEqual(0);
  expect(s.graphNodes).toBeGreaterThanOrEqual(0);
  expect(s.graphEdges).toBeGreaterThanOrEqual(0);
  expect(s.locations).toBeGreaterThanOrEqual(0);
});
