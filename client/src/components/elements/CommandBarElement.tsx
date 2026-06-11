import type { FormLayoutElement } from "../../types";
import type { AttributeV2 } from "../../types-metadata";
import CommandBarControl from "../controls/CommandBarControl";
import ButtonElement from "./ButtonElement";

interface Props {
  element: { elements: FormLayoutElement[] };
  attribute?: AttributeV2 | null;
}

export default function CommandBarElement({ element }: Props) {
  const buttons = (element.elements ?? []).filter(e => e.view === "button");

  if (buttons.length === 0) return null;

  return (
    <CommandBarControl>
      {buttons.map((btn, i) => (
        <ButtonElement key={i} element={btn} />
      ))}
    </CommandBarControl>
  );
}
