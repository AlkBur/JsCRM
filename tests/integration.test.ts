import { expect, test } from "bun:test";
import { VM } from "../src/legacy/vm";
import { parse } from "../src/legacy/parser";
import { RuntimeObject } from "../src/runtime-object";

test("Обработчик ПриИзмененииСуммы: Сумма=100 -> НДС=20", async () => {
  const code = await Bun.file("src/handlers/ПриИзмененииСуммы.1c").text();
  const ast = parse(code);
  const vm = new VM();
  const obj = new RuntimeObject();
  obj.load({ Сумма: 100, НДС: 0 });

  const vars: Record<string, any> = { Объект: obj };
  await vm.execute(ast, vars);

  expect(obj.get("НДС")).toBe(20);
});

test("Обработчик ПриИзмененииСуммы: Сумма=250 -> НДС=50", async () => {
  const code = await Bun.file("src/handlers/ПриИзмененииСуммы.1c").text();
  const ast = parse(code);
  const vm = new VM();
  const obj = new RuntimeObject();
  obj.load({ Сумма: 250, НДС: 0 });

  const vars: Record<string, any> = { Объект: obj };
  await vm.execute(ast, vars);

  expect(obj.get("НДС")).toBe(50);
});

test("RuntimeObject onChange listener", async () => {
  const obj = new RuntimeObject();
  obj.load({ Сумма: 0, НДС: 0 });

  let changedField = "";
  let changedValue: any = null;
  obj.onChange((field, value) => {
    changedField = field;
    changedValue = value;
  });

  obj.set("Сумма", 500);
  expect(changedField).toBe("Сумма");
  expect(changedValue).toBe(500);
  expect(obj.get("Сумма")).toBe(500);
});

test("RuntimeObject toJSON", async () => {
  const obj = new RuntimeObject();
  obj.load({ Сумма: 100, НДС: 20 });
  expect(obj.toJSON()).toEqual({ Сумма: 100, НДС: 20 });
});
