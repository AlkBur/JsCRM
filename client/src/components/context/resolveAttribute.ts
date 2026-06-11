import type { AttributeV2, MetadataEntity } from "../../types-metadata";
import type { FormLayoutElement } from "../../types";

export function hasDataPath(
  element: FormLayoutElement
): element is FormLayoutElement & { dataPath: string } {
  return "dataPath" in element;
}

export function resolveAttribute(
  entity: MetadataEntity | null,
  dataPath?: string
): AttributeV2 | null {
  if (!entity || !dataPath) return null;

  const stripped = dataPath.startsWith("Объект.") ? dataPath.slice(7) : dataPath;
  const parts = stripped.split(".");

  if (parts.length === 1) {
    const attr = entity.attributes.find(a => a.name === parts[0]);
    return attr ?? null;
  }

  if (parts.length === 2 && entity.tabularSections) {
    const section = entity.tabularSections.find(ts => ts.name === parts[0]);
    if (!section) return null;
    const attr = section.attributes.find(a => a.name === parts[1]);
    return attr ?? null;
  }

  return null;
}
