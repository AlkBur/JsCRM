import styles from "./controls.module.css";

interface Props {
  text: string;
}

export default function LabelControl({ text }: Props) {
  return <span className={styles.label}>{text}</span>;
}
