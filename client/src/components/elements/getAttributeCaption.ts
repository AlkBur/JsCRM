import type { AttributeV2 } from "../../types-metadata";

export function getAttributeCaption(
  attribute: AttributeV2 | null,
  fallback?: string
): string {
  return attribute?.synonym ?? fallback ?? attribute?.name ?? "";
}
