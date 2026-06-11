import { useState, useEffect, useCallback } from "react";
import type { FieldType, FormScreenDto, ObjectRef } from "../../types";
import { fetchObjectList, fetchObject, postAction } from "../../api";
import DefaultFormView from "../views/DefaultFormView";
import styles from "./DetailPanel.module.css";

function isFormScreenDto(v: unknown): v is FormScreenDto {
  return typeof v === "object" && v !== null && "form" in v && "schema" in (v as any).form && "layout" in (v as any).form;
}

interface FormState {
  values: Record<string, unknown>;
  dirty: boolean;
  objectId: string | null;
}

interface Props {
  nodeId: string | null;
  data: unknown;
}

export default function DetailPanel({ nodeId, data }: Props) {
  const [formState, setFormState] = useState<FormState>({ values: {}, dirty: false, objectId: null });
  const [objectList, setObjectList] = useState<ObjectRef[]>([]);
  const [saveError, setSaveError] = useState<string | undefined>();

  const dto = isFormScreenDto(data) ? data : null;
  const objectName = dto?.object?.name ?? "";

  useEffect(() => {
    setFormState({ values: {}, dirty: false, objectId: null });
    setObjectList([]);
    setSaveError(undefined);

    if (!dto || !objectName) return;

    fetchObjectList(objectName).then(list => {
      setObjectList(list);
      if (list.length > 0) {
        const firstId = list[0]!.id;
        setFormState(prev => ({ ...prev, objectId: firstId }));
        fetchObject(objectName, firstId).then(snap => {
          setFormState({ values: snap.values, dirty: false, objectId: firstId });
        }).catch(() => setSaveError("Ошибка загрузки объекта"));
      }
    }).catch(() => setSaveError("Ошибка загрузки списка объектов"));
  }, [nodeId, dto, objectName]);

  const handleSelectObject = useCallback((id: string) => {
    setFormState(prev => ({ ...prev, objectId: id }));
    fetchObject(objectName, id).then(snap => {
      setFormState({ values: snap.values, dirty: false, objectId: id });
    }).catch(() => setSaveError("Ошибка загрузки объекта"));
  }, [objectName]);

  const handleChange = useCallback((dataPath: string, value: unknown) => {
    const key = dataPath.startsWith("Объект.") ? dataPath.slice(7) : dataPath;
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [key]: value },
      dirty: true,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!objectName || !formState.objectId) return;
    setSaveError(undefined);
    const result = await postAction({
      type: "object.save",
      payload: {
        object: objectName,
        id: formState.objectId,
        values: formState.values,
      },
    });
    if (result.ok) {
      setFormState(prev => ({ ...prev, dirty: false }));
    } else {
      setSaveError(result.error ?? "Ошибка сохранения");
    }
  }, [objectName, formState.objectId, formState.values]);

  if (dto) {
    return (
      <DefaultFormView
        dto={dto}
        values={formState.values}
        dirty={formState.dirty}
        onChange={handleChange}
        onSave={handleSave}
        saveError={saveError}
        objectList={objectList}
        selectedObjectId={formState.objectId}
        onSelectObject={handleSelectObject}
      />
    );
  }

  if (!nodeId) {
    return <div className={styles.root}><p className={styles.empty}>Выберите элемент в дереве</p></div>;
  }

  if (!data) {
    return <div className={styles.root}><p className={styles.empty}>Загрузка...</p></div>;
  }

  const d = data as Record<string, unknown>;
  const items = d.items as unknown[] | undefined;

  if (nodeId.endsWith(".Attributes")) {
    const list = items ?? d.attributes as unknown[];
    if (!list || !isAttributeArray(list)) return <div className={styles.root}><p className={styles.empty}>Нет реквизитов</p></div>;
    return renderAttributes(list);
  }

  if (nodeId.endsWith(".TabularSections")) {
    const list = items ?? d.tabularSections as unknown[];
    if (!list || !isTabularArray(list)) return <div className={styles.root}><p className={styles.empty}>Нет табличных частей</p></div>;
    return renderTabularSections(list);
  }

  if (nodeId.endsWith(".Forms")) {
    const list = items ?? d.forms as unknown[];
    if (!list || !isFormArray(list)) return <div className={styles.root}><p className={styles.empty}>Нет форм</p></div>;
    return renderForms(list);
  }

  if (nodeId.endsWith(".Commands")) {
    const list = items ?? d.commands as unknown[];
    if (!list || !isCommandArray(list)) return <div className={styles.root}><p className={styles.empty}>Нет команд</p></div>;
    return renderCommands(list);
  }

  if (d.kind === "enumeration") {
    const vals = d.values as unknown[];
    if (!vals || !isEnumValueArray(vals)) return <div className={styles.root}><p className={styles.empty}>Нет значений</p></div>;
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Перечисление: {d.name as string}</h2>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Значения</h3>
          <ul className={styles.enumList}>
            {vals.map(v => <li key={v.uuid} className={styles.enumItem}>• {v.name}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  const attrs = d.attributes as unknown[];
  const tabs = d.tabularSections as unknown[];
  const forms = d.forms as unknown[];
  const cmds = d.commands as unknown[];

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{d.name as string}</h2>
      {isAttributeArray(attrs) && renderAttributes(attrs)}
      {isTabularArray(tabs) && renderTabularSections(tabs)}
      {isFormArray(forms) && renderForms(forms)}
      {isCommandArray(cmds) && renderCommands(cmds)}
    </div>
  );
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

function renderAttributes(attrs: Array<{ name: string; type: FieldType; required: boolean }>) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Реквизиты</h3>
      <table className={styles.table}>
        <thead><tr><th>Имя</th><th>Тип</th></tr></thead>
        <tbody>
          {attrs.map(a => (
            <tr key={a.name}>
              <td>{a.name}{a.required && <span className={styles.requiredStar}>*</span>}</td>
              <td><span className={styles.typeLabel}>{typeLabel(a.type)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderTabularSections(tabs: Array<{ name: string; attributes: Array<{ name: string; type: FieldType }> }>) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Табличные части</h3>
      {tabs.map(t => (
        <div key={t.name} style={{ marginBottom: 12 }}>
          <h4 className={styles.subTitle}>{t.name}</h4>
          <table className={styles.table}>
            <thead><tr><th>Имя</th><th>Тип</th></tr></thead>
            <tbody>
              {t.attributes.map(a => (
                <tr key={a.name}>
                  <td>{a.name}</td>
                  <td><span className={styles.typeLabel}>{typeLabel(a.type)}</span></td>
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
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Формы</h3>
      <table className={styles.table}>
        <thead><tr><th>Имя</th><th>Тип</th></tr></thead>
        <tbody>
          {forms.map(f => (
            <tr key={f.name}>
              <td>{f.name}</td>
              <td><span className={styles.typeLabel}>{f.type === "managed" ? "Управляемая" : "Обычная"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCommands(cmds: Array<{ name: string; handler: string }>) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Команды</h3>
      <table className={styles.table}>
        <thead><tr><th>Имя</th><th>Обработчик</th></tr></thead>
        <tbody>
          {cmds.map(c => (
            <tr key={c.name}>
              <td>{c.name}</td>
              <td><span className={styles.typeLabel}>{c.handler}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
