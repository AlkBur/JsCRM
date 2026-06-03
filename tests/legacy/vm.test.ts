import { expect, test } from "bun:test";
import { VM } from "../../src/legacy/vm";
import { parse } from "../../src/legacy/parser";

function exec(code: string, vars?: Record<string, any>): Promise<any> {
  const ast = parse(code);
  const vm = new VM();
  return vm.execute(ast, vars ?? {});
}

test("арифметика: 2 + 2 * 2 = 6", async () => {
  const result = await exec("Возврат 2 + 2 * 2;");
  expect(result).toBe(6);
});

test("сравнение: (5 > 3) И (1 < 2) = Истина", async () => {
  const result = await exec("Возврат (5 > 3) И (1 < 2);");
  expect(result).toBe(true);
});

test("строки: сложение", async () => {
  const result = await exec('Возврат "a" + "b";');
  expect(result).toBe("ab");
});

test("присваивание + возврат", async () => {
  const result = await exec(`
    a = 10;
    b = 20;
    c = a + b;
    Возврат c;
  `);
  expect(result).toBe(30);
});

test("Если-Тогда", async () => {
  const result = await exec(`
    x = 5;
    Если x > 3 Тогда
      y = 100;
    КонецЕсли;
    Возврат y;
  `);
  expect(result).toBe(100);
});

test("Если-Иначе", async () => {
  const result = await exec(`
    x = 1;
    Если x > 3 Тогда
      y = 100;
    Иначе
      y = 200;
    КонецЕсли;
    Возврат y;
  `);
  expect(result).toBe(200);
});

test("Цикл Для", async () => {
  const result = await exec(`
    Сумма = 0;
    Для i = 1 По 3 Цикл
      Сумма = Сумма + i;
    КонецЦикла;
    Возврат Сумма;
  `);
  expect(result).toBe(6);
});

test("Новый Структура", async () => {
  const result = await exec(`
    Стр = Новый Структура("Ключ", 123);
    Возврат Стр.Ключ;
  `);
  expect(result).toBe(123);
});

test("Новый Массив + Добавить", async () => {
  const result = await exec(`
    М = Новый Массив;
    М.Добавить(10);
    Возврат М.Получить(0);
  `);
  expect(result).toBe(10);
});

test("Вложенные Если", async () => {
  const result = await exec(`
    a = 10;
    b = 20;
    Если a > 5 Тогда
      Если b > 15 Тогда
        result = "ok";
      КонецЕсли;
    КонецЕсли;
    Возврат result;
  `);
  expect(result).toBe("ok");
});

test("Истина/Ложь", async () => {
  const result = await exec(`
    a = Истина;
    b = Ложь;
    Возврат a И Не b;
  `);
  expect(result).toBe(true);
});
