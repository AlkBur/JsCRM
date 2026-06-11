import { createContext, useContext } from "react";
import type { FormDocument } from "../../types";
import type { MetadataEntity } from "../../types-metadata";

export interface UIContextValue {
  form: FormDocument;
  metadata: MetadataEntity | null;
}

const FormContext = createContext<UIContextValue | null>(null);

export function FormProvider({ value, children }: { value: UIContextValue; children: React.ReactNode }) {
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext(): UIContextValue | null {
  return useContext(FormContext);
}
