import type { AttributeV2 } from "../../types-metadata";
import LabelControl from "../controls/LabelControl";

interface Props {
  element: { title?: string; name: string; text?: string };
  attribute?: AttributeV2 | null;
}

export default function LabelElement({ element, attribute }: Props) {
  const text = attribute?.synonym ?? element.text ?? element.title ?? element.name;
  return <LabelControl text={text} />;
}
