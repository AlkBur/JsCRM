import styles from "./controls.module.css";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  readOnly?: boolean;
}

export default function InputControl({ label, value, onChange, required, readOnly }: Props) {
  return (
    <div className={`${styles.field} ${required ? styles.required : ""} ${readOnly ? styles.readonly : ""}`}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.value}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
