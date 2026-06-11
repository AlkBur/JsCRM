export interface ParsedObjectName {
  kind: string;
  name: string;
}

export function parseObjectName(value: string): ParsedObjectName {
  const dot = value.indexOf(".");
  if (dot === -1) {
    return { kind: "", name: value };
  }
  return {
    kind: value.slice(0, dot),
    name: value.slice(dot + 1),
  };
}

export function buildObjectName(kind: string, name: string): string {
  return `${kind}.${name}`;
}
