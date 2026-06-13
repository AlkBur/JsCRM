import { useState, useEffect } from "react";
import { loadReferenceList } from "../../utils/referenceCache";
import styles from "./controls.module.css";

interface Props {
  object: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export default function ReferenceControl({ object, value, onChange, disabled }: Props) {
  const [options, setOptions] = useState<readonly { id: string; label: string }[]>([]);

  useEffect(() => {
    loadReferenceList(object).then(setOptions);
  }, [object]);

  const currentId = (value as { id?: string })?.id ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const selected = options.find(o => o.id === id);
    if (selected) {
      onChange({ ref: object, id: selected.id, description: selected.label });
    }
  };

  return (
    <div className={styles.field}>
      <select
        className={styles.value}
        value={currentId}
        disabled={disabled}
        onChange={handleChange}
      >
        <option value="" disabled>— Выберите —</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
