import InputControl from "../controls/InputControl";
import CheckboxControl from "../controls/CheckboxControl";
import LabelControl from "../controls/LabelControl";
import GroupControl from "../controls/GroupControl";
import TableControl from "../controls/TableControl";
import CommandBarControl from "../controls/CommandBarControl";

export default function ComponentGallery() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ margin: 0 }}>Component Gallery — M4A</h2>

      <Section title="InputControl">
        <InputControl label="Наименование" value="Тест" onChange={v => console.log(v)} />
        <InputControl label="Обязательный" value="" required onChange={v => console.log(v)} />
        <InputControl label="Только чтение" value="Значение" readOnly onChange={v => console.log(v)} />
      </Section>

      <Section title="CheckboxControl">
        <CheckboxControl label="Активен" checked onChange={v => console.log(v)} />
        <CheckboxControl label="Не активен" checked={false} onChange={v => console.log(v)} />
      </Section>

      <Section title="LabelControl">
        <LabelControl text="Обычный текст" />
        <LabelControl text="Ещё один текст" />
      </Section>

      <Section title="GroupControl">
        <GroupControl label="Группа с заголовком" border>
          <LabelControl text="Внутри группы" />
        </GroupControl>
        <GroupControl label="Горизонтальная" layout="horizontal" border>
          <InputControl label="Поле 1" value="" onChange={v => console.log(v)} />
          <InputControl label="Поле 2" value="" onChange={v => console.log(v)} />
        </GroupControl>
      </Section>

      <Section title="TableControl">
        <TableControl
          title="Табличная часть"
          columns={[{ key: "name", title: "Наименование" }, { key: "qty", title: "Количество" }]}
          rows={[
            { name: "Товар А", qty: 10 },
            { name: "Товар Б", qty: 5 },
          ]}
        />
      </Section>

      <Section title="CommandBarControl">
        <CommandBarControl>
          <button className="gallery-btn" style={{ padding: "4px 12px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: "pointer" }}>Записать</button>
          <button className="gallery-btn" style={{ padding: "4px 12px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: "pointer" }}>Закрыть</button>
        </CommandBarControl>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#666", textTransform: "uppercase" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}
