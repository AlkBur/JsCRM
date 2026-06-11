import type { FormDocument } from "./form-types";
import type { CatalogV2, DocumentV2 } from "../../metadata/metadata-types-v2";

export type MetadataEntity = CatalogV2 | DocumentV2;

export interface FormScreenDto {
  form: FormDocument;
  metadata: MetadataEntity | null;
  object?: { name: string };
  sessionId?: string;
}
