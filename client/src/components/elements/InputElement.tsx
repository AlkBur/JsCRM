import type { AttributeV2 } from "../../types-metadata";
import { getAttributeCaption } from "./getAttributeCaption";
import { displayValue } from "../../utils/displayValue";
import InputControl from "../controls/InputControl";
import CheckboxControl from "../controls/CheckboxControl";

interface Props {
  element: { title?: string; name: string; readonly?: boolean };
  attribute?: AttributeV2 | null;
  value: unknown;
  onChange: (value: unknown) => void;
}

export default function InputElement({ element, attribute, value, onChange }: Props) {
  const label = getAttributeCaption(attribute, element.title ?? element.name);

  if (attribute?.type.kind === "boolean") {
    return (
      <CheckboxControl label={label} checked={!!value} onChange={onChange} />
    );
  }

  return (
    <InputControl
      label={label}
      value={displayValue(value, attribute?.type.kind)}
      onChange={onChange}
      readOnly={element.readonly}
    />
  );
}
