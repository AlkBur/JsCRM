import { displayValue } from "../FormView/displayValue";
import styles from "./controls.module.css";

export interface TableColumn {
  key: string;
  title: string;
}

interface Props {
  title?: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

export default function TableControl({ title, columns, rows }: Props) {
  return (
    <div className={styles.tableWrapper}>
      {title && <span className={styles.tableTitle}>{title}</span>}
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>{displayValue(row[col.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
