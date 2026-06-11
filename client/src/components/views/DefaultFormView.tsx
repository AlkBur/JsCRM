import type { FormDocument, FormLayoutElement, ObjectRef, FormScreenDto } from "../../types";
import type { MetadataEntity } from "../../types-metadata";
import { FormProvider } from "../context/UIContext";
import FormElementRenderer from "../renderers/FormElementRenderer";
import styles from "../FormView/FormView.module.css";

interface Props {
  dto: FormScreenDto;
  values: Record<string, unknown>;
  dirty: boolean;
  onChange: (dataPath: string, value: unknown) => void;
  onSave: () => void;
  saveError?: string;
  objectList: ObjectRef[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
}

export default function DefaultFormView({
  dto,
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
    <FormProvider value={{ form: dto.form, metadata: dto.metadata as MetadataEntity | null }}>
      <div className={styles.root}>
        <div className={styles.toolbar}>
          {objectList.length > 0 && (
            <>
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
            </>
          )}
        </div>
        {saveError && <div className={styles.error}>{saveError}</div>}
        <h2 className={styles.title}>{dto.form.form.synonym || dto.form.form.name}</h2>
        <div className={styles.body}>
          <FormElementRenderer
            element={dto.form.layout}
            values={values}
            onChange={onChange}
            path=""
          />
        </div>
        {renderButtons(dto.form.layout)}
      </div>
    </FormProvider>
  );
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
