import type { AttributeV2 } from "../../types-metadata";
import { stripObjectPrefix } from "../../utils/displayValue";
import TableControl from "../controls/TableControl";
import type { TableColumn } from "../controls/TableControl";

interface ColumnDef {
  name: string;
  title?: string;
  dataPath: string;
}

interface Props {
  element: {
    title?: string;
    name: string;
    dataPath: string;
    columns?: ColumnDef[];
  };
  attribute?: AttributeV2 | null;
  values: Record<string, unknown>;
}

export default function TableElement({ element, values }: Props) {
  const sectionName = stripObjectPrefix(element.dataPath);
  const rows = (values[sectionName] as Record<string, unknown>[]) ?? [];

  const columns: TableColumn[] = (element.columns ?? []).map(col => {
    const stripped = stripObjectPrefix(col.dataPath);
    const key = stripped.split(".").pop() ?? col.name;
    return { key, title: col.title ?? col.name };
  });

  return <TableControl title={element.title} columns={columns} rows={rows} />;
}
