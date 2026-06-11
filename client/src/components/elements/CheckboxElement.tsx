import CheckboxControl from "../controls/CheckboxControl";

interface Props {
  element: { title?: string; name: string };
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function CheckboxElement({ element, checked, onChange }: Props) {
  return (
    <CheckboxControl
      label={element.title ?? element.name}
      checked={checked}
      onChange={onChange}
    />
  );
}
