import styles from "./controls.module.css";

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function CheckboxControl({ label, checked, onChange }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type="checkbox"
        className={styles.value}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
    </div>
  );
}
