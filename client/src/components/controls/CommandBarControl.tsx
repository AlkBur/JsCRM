import type { ReactNode } from "react";
import styles from "./controls.module.css";

interface Props {
  children: ReactNode;
}

export default function CommandBarControl({ children }: Props) {
  return <div className={styles.commandBar}>{children}</div>;
}
