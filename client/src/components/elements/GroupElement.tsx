import type { FormLayoutElement } from "../../types";
import GroupControl from "../controls/GroupControl";
import FormElementRenderer from "../renderers/FormElementRenderer";

interface Props {
  element: {
    title?: string;
    name: string;
    showTitle?: boolean;
    showBorder?: boolean;
    layout?: string;
    elements: FormLayoutElement[];
  };
  values: Record<string, unknown>;
  onChange: (dataPath: string, value: unknown) => void;
  path: string;
}

export default function GroupElement({ element, values, onChange, path }: Props) {
  return (
    <GroupControl
      label={element.showTitle ? element.title : undefined}
      border={element.showBorder}
      layout={element.layout}
    >
      {(element.elements ?? []).map((child, i) => (
        <FormElementRenderer
          key={`${path}.${i}`}
          element={child}
          values={values}
          onChange={onChange}
          path={`${path}.${i}`}
        />
      ))}
    </GroupControl>
  );
}
