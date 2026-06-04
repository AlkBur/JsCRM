interface Props {
  value: string;
  onChange: (q: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Поиск..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
