import type { ReactNode } from "react";
import styles from "./controls.module.css";

interface Props {
  label?: string;
  border?: boolean;
  layout?: string;
  children: ReactNode;
}

export default function GroupControl({ label, border, layout, children }: Props) {
  const dir = layout === "horizontal" ? styles.groupHorizontal : styles.groupVertical;
  const frame = border ? styles.groupFramed : "";
  return (
    <div className={`${styles.group} ${dir} ${frame}`}>
      {label && <span className={styles.groupTitle}>{label}</span>}
      {children}
    </div>
  );
}
