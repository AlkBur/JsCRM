import styles from "./SearchBar.module.css";

interface Props {
  value: string;
  onChange: (q: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className={styles.root}>
      <input className={styles.input} type="search" placeholder="Поиск..." value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
