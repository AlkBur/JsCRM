import type { FormLayoutElement } from "../../types";
import type { AttributeV2 } from "../../types-metadata";
import { stripObjectPrefix } from "../../utils/displayValue";
import { resolveAttribute, hasDataPath } from "../context/resolveAttribute";
import { useFormContext } from "../context/UIContext";
import InputElement from "../elements/InputElement";
import CheckboxElement from "../elements/CheckboxElement";
import LabelElement from "../elements/LabelElement";
import GroupElement from "../elements/GroupElement";
import TableElement from "../elements/TableElement";
import ButtonElement from "../elements/ButtonElement";
import CommandBarElement from "../elements/CommandBarElement";

interface Props {
  element: FormLayoutElement;
  values: Record<string, unknown>;
  onChange: (dataPath: string, value: unknown) => void;
  path: string;
}

const renderers: Record<string, React.ComponentType<any>> = {
  input: InputElement,
  checkbox: CheckboxElement,
  label: LabelElement,
  group: GroupElement,
  tabs: GroupElement,
  tab: GroupElement,
  table: TableElement,
  button: ButtonElement,
  commandBar: CommandBarElement,
};

export default function FormElementRenderer({ element, values, onChange, path }: Props) {
  if (element.view === "form") {
    console.warn("FormElementRenderer: root form element must be handled by DefaultFormView");
    return null;
  }

  const ctx = useFormContext();
  const metadata = ctx?.metadata ?? null;
  const Component = renderers[element.view];

  if (!Component) {
    return (
      <div key={path} style={{ fontStyle: "italic", color: "var(--color-muted)", fontSize: "var(--font-size-small)", padding: "var(--spacing-1) 0" }}>
        {element.name} ({element.view})
      </div>
    );
  }

  let attribute: AttributeV2 | null = null;
  if (hasDataPath(element)) {
    attribute = resolveAttribute(metadata, element.dataPath);
  }

  if (hasDataPath(element)) {
    const key = stripObjectPrefix(element.dataPath);
    const value = values[key];
    return (
      <Component
        element={element}
        attribute={attribute}
        values={values}
        value={value}
        checked={!!value}
        onChange={(v: unknown) => onChange(element.dataPath, v)}
        path={path}
      />
    );
  }

  return <Component element={element} attribute={attribute} values={values} onChange={onChange} path={path} />;
}
