import { expect, test, describe } from "bun:test";
import { getValidator, validateIR } from "../ir/ir-validator";

const validate = getValidator();

describe("IR v1 schema validation", () => {

  test("fixture: arithmetic.ir.json — valid", async () => {
    const data = await Bun.file("fixtures/arithmetic.ir.json").json();
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("fixture: function-call.ir.json — valid", async () => {
    const data = await Bun.file("fixtures/function-call.ir.json").json();
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("fixture: object-member.ir.json — valid", async () => {
    const data = await Bun.file("fixtures/object-member.ir.json").json();
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("missing irVersion — invalid", () => {
    const data = { module: { name: "Test", body: { routines: [], globals: [] } } };
    const { valid, errors } = validateIR(data);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes("irVersion"))).toBe(true);
  });

  test("wrong irVersion — invalid", () => {
    const data = {
      irVersion: 999,
      module: { name: "Test", body: { routines: [], globals: [] } },
    };
    const { valid } = validateIR(data);
    expect(valid).toBe(false);
  });

  test("additional property on stmt — invalid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "Test",
        body: {
          routines: [{
            kind: "function",
            name: "f",
            export: false,
            params: [],
            body: [{
              kind: "number",
              value: 1,
              extraField: "forbidden",
            }],
          }],
          globals: [],
        },
      },
    };
    const { valid } = validateIR(data);
    expect(valid).toBe(false);
  });

  test("invalid binary op — invalid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "Test",
        body: {
          routines: [{
            kind: "function",
            name: "f",
            export: false,
            params: [],
            body: [{
              kind: "return",
              value: {
                kind: "binary",
                op: "%%%",
                left: { kind: "number", value: 1 },
                right: { kind: "number", value: 2 },
              },
            }],
          }],
          globals: [],
        },
      },
    };
    const { valid } = validateIR(data);
    expect(valid).toBe(false);
  });

  test("valid minimal module", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "Minimal",
        body: {
          routines: [{
            kind: "function",
            name: "f",
            export: false,
            params: [],
            body: [
              { kind: "return", value: { kind: "number", value: 42 } },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("valid while loop", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "WhileTest",
        body: {
          routines: [{
            kind: "function",
            name: "loop",
            export: false,
            params: [],
            body: [
              {
                kind: "while",
                cond: { kind: "boolean", value: false },
                body: [
                  { kind: "break" },
                ],
              },
              { kind: "return", value: { kind: "number", value: 0 } },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("valid foreach", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "ForEachTest",
        body: {
          routines: [{
            kind: "function",
            name: "loop",
            export: false,
            params: [],
            body: [
              {
                kind: "foreach",
                variable: "Стр",
                collection: { kind: "variable", name: "Товары" },
                body: [
                  { kind: "continue" },
                ],
              },
              { kind: "return", value: { kind: "number", value: 0 } },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("return without value — valid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "ReturnTest",
        body: {
          routines: [
            {
              kind: "procedure",
              name: "p",
              export: false,
              params: [],
              body: [
                { kind: "return" },
              ],
            },
          ],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("try/throw — valid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "TryTest",
        body: {
          routines: [{
            kind: "function",
            name: "test",
            export: false,
            params: [],
            body: [
              {
                kind: "try",
                try: [
                  { kind: "throw", value: { kind: "string", value: "err" } },
                ],
                catch: [
                  { kind: "return", value: { kind: "number", value: 0 } },
                ],
              },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("call method — valid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "CallMethodTest",
        body: {
          routines: [{
            kind: "procedure",
            name: "p",
            export: false,
            params: [],
            body: [
              {
                kind: "call",
                object: { kind: "variable", name: "obj" },
                method: "Добавить",
                args: [{ kind: "number", value: 1 }],
              },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("call function — valid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "CallFuncTest",
        body: {
          routines: [{
            kind: "function",
            name: "f",
            export: false,
            params: [],
            body: [
              {
                kind: "return",
                value: {
                  kind: "call",
                  name: "Удвоить",
                  args: [{ kind: "number", value: 5 }],
                },
              },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });

  test("stmt with else: Stmt[] (empty) — valid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "ElseArrTest",
        body: {
          routines: [{
            kind: "function",
            name: "f",
            export: false,
            params: [],
            body: [
              {
                kind: "if",
                cond: { kind: "boolean", value: true },
                then: [{ kind: "return", value: { kind: "number", value: 1 } }],
                else: [],
              },
            ],
          }],
          globals: [],
        },
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });
});
