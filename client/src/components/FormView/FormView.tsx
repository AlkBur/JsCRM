import type { FormDocument, FormLayoutElement } from "../../types";
import styles from "./FormView.module.css";

interface Props {
  form: FormDocument;
}

export default function FormView({ form }: Props) {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{form.form.synonym || form.form.name}</h2>
      <div className={styles.body}>
        {renderElement(form.layout, "")}
      </div>
    </div>
  );
}

function renderElement(el: FormLayoutElement, path: string): React.ReactNode {
  const key = path || el.name;

  switch (el.view) {
    case "form":
    case "group": {
      const dir = "layout" in el && el.layout === "horizontal" ? styles.horizontal : styles.vertical;
      const frame = "showBorder" in el && el.showBorder ? styles.groupFramed : "";
      return (
        <div key={key} className={`${styles.group} ${dir} ${frame}`}>
          {"showTitle" in el && el.showTitle && el.title && <span className={styles.groupTitle}>{el.title}</span>}
          {"elements" in el && el.elements.map((child, i) => renderElement(child, `${key}.${i}`))}
        </div>
      );
    }
    case "input":
      return (
        <div key={key} className={styles.field}>
          <label className={styles.fieldLabel}>{el.title || el.name}</label>
          <div className={styles.fieldValue}>{el.dataPath}</div>
        </div>
      );
    case "button":
      return (
        <button key={key} className={styles.button} disabled title={el.title}>
          {el.title || el.name}
        </button>
      );
    case "label":
      return (
        <div key={key} className={styles.label}>
          {"text" in el && el.text ? el.text : el.title || el.name}
        </div>
      );
    case "spacer":
      return <div key={key} className={styles.spacer} />;
    default:
      return (
        <div key={key} className={styles.unsupported}>
          {el.title || el.name} ({el.view})
        </div>
      );
  }
}
