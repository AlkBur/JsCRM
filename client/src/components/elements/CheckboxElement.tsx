import type { AttributeV2 } from "../../types-metadata";
import { getAttributeCaption } from "./getAttributeCaption";
import CheckboxControl from "../controls/CheckboxControl";

interface Props {
  element: { title?: string; name: string };
  attribute?: AttributeV2 | null;
  checked: boolean;
  onChange: (value: unknown) => void;
}

export default function CheckboxElement({ element, attribute, checked, onChange }: Props) {
  const label = getAttributeCaption(attribute, element.title ?? element.name);
  return <CheckboxControl label={label} checked={checked} onChange={onChange} />;
}
