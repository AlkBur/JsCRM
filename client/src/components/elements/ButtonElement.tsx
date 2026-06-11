import type { AttributeV2 } from "../../types-metadata";
import styles from "../controls/controls.module.css";

interface Props {
  element: { title?: string; name: string; enabled?: boolean };
  attribute?: AttributeV2 | null;
}

export default function ButtonElement({ element }: Props) {
  return (
    <button className={styles.button} disabled={element.enabled === false}>
      {element.title ?? element.name}
    </button>
  );
}
