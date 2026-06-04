interface Props {
  nodeId: string;
}

export default function Breadcrumb({ nodeId }: Props) {
  const parts = nodeId.split(".");
  const labels: string[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] === "catalogs") labels.push("Справочники");
    else if (parts[i] === "documents") labels.push("Документы");
    else if (parts[i] === "enumerations") labels.push("Перечисления");
    else if (parts[i] === "Attributes") labels.push("Реквизиты");
    else if (parts[i] === "TabularSections") labels.push("Табличные части");
    else if (parts[i] === "Forms") labels.push("Формы");
    else if (parts[i] === "Commands") labels.push("Команды");
    else if (parts[i] === "Catalog") labels.push(parts[i + 1] ?? parts[i]);
    else if (parts[i] === "Document") labels.push(parts[i + 1] ?? parts[i]);
    else if (parts[i] === "Enum") labels.push(parts[i + 1] ?? parts[i]);
    else labels.push(parts[i]);
  }

  return (
    <div className="breadcrumb">
      {labels.map((label, i) => (
        <span key={i}>
          {i > 0 && <span> / </span>}
          <span className="part">{label}</span>
        </span>
      ))}
    </div>
  );
}
