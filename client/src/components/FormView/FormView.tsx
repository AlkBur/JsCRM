import type { FormDocument, FormLayoutElement, ObjectRef } from "../../types";
import { displayValue, stripObjectPrefix } from "./displayValue";
import FormTable from "./FormTable";
import styles from "./FormView.module.css";

function lookupValue(values: Record<string, unknown>, dataPath: string): unknown {
  return values[stripObjectPrefix(dataPath)];
}

interface Props {
  form: FormDocument;
  values: Record<string, unknown>;
  dirty: boolean;
  onChange: (dataPath: string, value: unknown) => void;
  onSave: () => void;
  saveError?: string;
  objectName: string;
  objectList: ObjectRef[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
}

export default function FormView({
  form,
  values,
  dirty,
  onChange,
  onSave,
  saveError,
  objectList,
  selectedObjectId,
  onSelectObject,
}: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <select
          className={styles.selector}
          value={selectedObjectId ?? ""}
          onChange={e => onSelectObject(e.target.value)}
        >
          <option value="" disabled>— Выберите объект —</option>
          {objectList.map(ref => (
            <option key={ref.id} value={ref.id}>{ref.label}</option>
          ))}
        </select>
        <button
          className={`${styles.saveBtn} ${dirty ? styles.saveBtnActive : ""}`}
          disabled={!dirty}
          onClick={onSave}
        >
          Записать
        </button>
        {dirty && <span className={styles.dirtyBadge}>*</span>}
      </div>
      {saveError && <div className={styles.error}>{saveError}</div>}
      <h2 className={styles.title}>{form.form.synonym || form.form.name}</h2>
      <div className={styles.body}>
        {renderElement(form.layout, "", values, onChange)}
      </div>
      {renderButtons(form.layout)}
    </div>
  );
}

function renderElement(
  el: FormLayoutElement,
  path: string,
  values: Record<string, unknown>,
  onChange: (dataPath: string, value: unknown) => void,
): React.ReactNode {
  const key = path || el.name;

  switch (el.view) {
    case "form":
    case "group": {
      const dir = "layout" in el && el.layout === "horizontal" ? styles.horizontal : styles.vertical;
      const frame = "showBorder" in el && el.showBorder ? styles.groupFramed : "";
      return (
        <div key={key} className={`${styles.group} ${dir} ${frame}`}>
          {"showTitle" in el && el.showTitle && el.title && <span className={styles.groupTitle}>{el.title}</span>}
          {"elements" in el && el.elements.map((child, i) => renderElement(child, `${key}.${i}`, values, onChange))}
        </div>
      );
    }
    case "input": {
      const value = lookupValue(values, el.dataPath);
      return (
        <div key={key} className={styles.field}>
          <label className={styles.fieldLabel}>{el.title || el.name}</label>
          <input
            className={styles.fieldValue}
            value={displayValue(value)}
            onChange={e => onChange(el.dataPath, e.target.value)}
          />
        </div>
      );
    }
    case "checkbox": {
      const value = lookupValue(values, el.dataPath);
      return (
        <div key={key} className={styles.field}>
          <label className={styles.fieldLabel}>{el.title || el.name}</label>
          <input
            type="checkbox"
            className={styles.fieldValue}
            checked={!!value}
            onChange={e => onChange(el.dataPath, e.target.checked)}
          />
        </div>
      );
    }
    case "button":
      return null;
    case "label":
      return (
        <div key={key} className={styles.label}>
          {"text" in el && el.text ? el.text : el.title || el.name}
        </div>
      );
    case "spacer":
      return <div key={key} className={styles.spacer} />;
    case "select": {
      const value = lookupValue(values, el.dataPath);
      return (
        <div key={key} className={styles.field}>
          <label className={styles.fieldLabel}>{el.title || el.name}</label>
          <input
            className={styles.fieldValue}
            value={displayValue(value)}
            onChange={e => onChange(el.dataPath, e.target.value)}
          />
        </div>
      );
    }
    case "tabs":
    case "tab": {
      return (
        <div key={key} className={styles.group}>
          {"elements" in el && el.elements.map((child, i) => renderElement(child, `${key}.${i}`, values, onChange))}
        </div>
      );
    }
    case "table":
      return (
        <div key={key} className={styles.tableWrapper}>
          {"title" in el && el.title && <span className={styles.tableTitle}>{el.title}</span>}
          <FormTable columns={"columns" in el ? el.columns : undefined} dataPath={el.dataPath} values={values} />
        </div>
      );
    default:
      return (
        <div key={key} className={styles.unsupported}>
          {el.title || el.name} ({el.view})
        </div>
      );
  }
}

function renderButtons(el: FormLayoutElement): React.ReactNode {
  if ("elements" in el && el.elements) {
    const buttons = el.elements.filter(e => e.view === "button");
    if (buttons.length === 0) return null;
    return (
      <div className={styles.buttonRow}>
        {buttons.map((btn, i) => (
          <button key={i} className={styles.button}>{btn.title || btn.name}</button>
        ))}
      </div>
    );
  }
  return null;
}
