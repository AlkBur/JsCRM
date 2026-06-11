import { displayValue, stripObjectPrefix } from "./displayValue";
import styles from "./FormView.module.css";

interface TableColumn {
  name: string;
  title?: string;
  dataPath: string;
}

interface Props {
  columns?: TableColumn[];
  dataPath: string;
  values: Record<string, unknown>;
}

export default function FormTable({ columns, dataPath, values }: Props) {
  const sectionName = stripObjectPrefix(dataPath);
  const rows = (values[sectionName] as Array<Record<string, unknown>> | undefined) ?? [];

  if (!columns || columns.length === 0) {
    return (
      <table className={styles.formTable}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((v, j) => (
                <td key={j}>{displayValue(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className={styles.formTable}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.name}>{col.title || col.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={(row["LineNumber"] as string) ?? i}>
            {columns.map(col => {
              const stripped = stripObjectPrefix(col.dataPath);
              const fieldName = stripped.split(".").pop() ?? "";
              return <td key={col.name}>{displayValue(row[fieldName])}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
