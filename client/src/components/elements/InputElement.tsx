import InputControl from "../controls/InputControl";

interface Props {
  element: { title?: string; name: string; readonly?: boolean };
  value: unknown;
  onChange: (value: string) => void;
}

export default function InputElement({ element, value, onChange }: Props) {
  return (
    <InputControl
      label={element.title ?? element.name}
      value={value != null ? String(value) : ""}
      onChange={onChange}
      readOnly={element.readonly}
    />
  );
}
