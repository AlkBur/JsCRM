import LabelControl from "../controls/LabelControl";

interface Props {
  element: { title?: string; name: string; text?: string };
}

export default function LabelElement({ element }: Props) {
  return <LabelControl text={element.text ?? element.title ?? element.name} />;
}
