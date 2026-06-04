import type { FieldType } from "../types";

interface Props {
  nodeId: string | null;
  data: unknown;
}

function typeLabel(t: FieldType): string {
  switch (t.kind) {
    case "string": return "Строка" + (t.length ? "(" + t.length + ")" : "");
    case "number": return "Число(" + (t.precision ?? 0) + "," + (t.scale ?? 0) + ")";
    case "date": return "Дата";
    case "boolean": return "Булево";
    case "ref": return "Ссылка: " + t.target;
    case "enum": return "Перечисление: " + t.target;
    case "union": return "Составной (" + t.options.length + ")";
    default: return JSON.stringify(t);
  }
}

function isAttributeArray(v: unknown): v is Array<{ uuid?: string; name: string; type: FieldType; required: boolean }> {
  return Array.isArray(v) && v.length > 0 && "type" in v[0];
}

function isTabularArray(v: unknown): v is Array<{ uuid?: string; name: string; attributes: Array<{ name: string; type: FieldType }> }> {
  return Array.isArray(v) && v.length > 0 && "attributes" in v[0];
}

function isFormArray(v: unknown): v is Array<{ name: string; type: string }> {
  return Array.isArray(v) && v.length > 0 && "type" in v[0];
}

function isCommandArray(v: unknown): v is Array<{ uuid?: string; name: string; handler: string }> {
  return Array.isArray(v) && v.length > 0 && "handler" in v[0];
}

function isEnumValueArray(v: unknown): v is Array<{ uuid: string; name: string }> {
  return Array.isArray(v) && v.length > 0 && "uuid" in v[0] && "name" in v[0] && !("type" in v[0]);
}

export default function DetailPanel({ nodeId, data }: Props) {
  if (!nodeId) {
    return <div className="detail"><p className="empty-note">Выберите элемент в дереве</p></div>;
  }

  if (!data) {
    return <div className="detail"><p className="empty-note">Загрузка...</p></div>;
  }

  const d = data as Record<string, unknown>;
  const items = d.items as unknown[] | undefined;

  // Special folders: Attributes, TabularSections, Forms, Commands
  if (nodeId.endsWith(".Attributes")) {
    const list = items ?? d.attributes as unknown[];
    if (!list || !isAttributeArray(list)) return <div className="detail"><p className="empty-note">Нет реквизитов</p></div>;
    return renderAttributes(list);
  }

  if (nodeId.endsWith(".TabularSections")) {
    const list = items ?? d.tabularSections as unknown[];
    if (!list || !isTabularArray(list)) return <div className="detail"><p className="empty-note">Нет табличных частей</p></div>;
    return renderTabularSections(list);
  }

  if (nodeId.endsWith(".Forms")) {
    const list = items ?? d.forms as unknown[];
    if (!list || !isFormArray(list)) return <div className="detail"><p className="empty-note">Нет форм</p></div>;
    return renderForms(list);
  }

  if (nodeId.endsWith(".Commands")) {
    const list = items ?? d.commands as unknown[];
    if (!list || !isCommandArray(list)) return <div className="detail"><p className="empty-note">Нет команд</p></div>;
    return renderCommands(list);
  }

  // Enumeration
  if (d.kind === "enumeration") {
    const vals = d.values as unknown[];
    if (!vals || !isEnumValueArray(vals)) return <div className="detail"><p className="empty-note">Нет значений</p></div>;
    return (
      <div className="detail">
        <h2>Перечисление: {d.name as string}</h2>
        <div className="detail-section">
          <h3>Значения</h3>
          <ul style={{ listStyle: "none", fontSize: 13 }}>
            {vals.map(v => <li key={v.uuid} style={{ padding: "3px 0" }}>• {v.name}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  // Entity (catalog or document)
  const attrs = d.attributes as unknown[];
  const tabs = d.tabularSections as unknown[];
  const forms = d.forms as unknown[];
  const cmds = d.commands as unknown[];

  return (
    <div className="detail">
      <h2>{d.name as string}</h2>
      {isAttributeArray(attrs) && renderAttributes(attrs)}
      {isTabularArray(tabs) && renderTabularSections(tabs)}
      {isFormArray(forms) && renderForms(forms)}
      {isCommandArray(cmds) && renderCommands(cmds)}
    </div>
  );
}

function renderAttributes(attrs: Array<{ name: string; type: FieldType; required: boolean }>) {
  return (
    <div className="detail-section">
      <h3>Реквизиты</h3>
      <table className="detail-table">
        <thead><tr><th>Имя</th><th>Тип</th></tr></thead>
        <tbody>
          {attrs.map(a => (
            <tr key={a.name}>
              <td>{a.name}{a.required && <span className="required-star">*</span>}</td>
              <td><span className="type-label">{typeLabel(a.type)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderTabularSections(tabs: Array<{ name: string; attributes: Array<{ name: string; type: FieldType }> }>) {
  return (
    <div className="detail-section">
      <h3>Табличные части</h3>
      {tabs.map(t => (
        <div key={t.name} style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 13, margin: "4px 0", color: "#444" }}>{t.name}</h4>
          <table className="detail-table">
            <thead><tr><th>Имя</th><th>Тип</th></tr></thead>
            <tbody>
              {t.attributes.map(a => (
                <tr key={a.name}>
                  <td>{a.name}</td>
                  <td><span className="type-label">{typeLabel(a.type)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function renderForms(forms: Array<{ name: string; type: string }>) {
  return (
    <div className="detail-section">
      <h3>Формы</h3>
      <table className="detail-table">
        <thead><tr><th>Имя</th><th>Тип</th></tr></thead>
        <tbody>
          {forms.map(f => (
            <tr key={f.name}>
              <td>{f.name}</td>
              <td><span className="type-label">{f.type === "managed" ? "Управляемая" : "Обычная"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCommands(cmds: Array<{ name: string; handler: string }>) {
  return (
    <div className="detail-section">
      <h3>Команды</h3>
      <table className="detail-table">
        <thead><tr><th>Имя</th><th>Обработчик</th></tr></thead>
        <tbody>
          {cmds.map(c => (
            <tr key={c.name}>
              <td>{c.name}</td>
              <td><span className="type-label">{c.handler}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
