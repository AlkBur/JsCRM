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
    const data = { module: { name: "Test", globals: [], procedures: [], functions: [] } };
    const { valid, errors } = validateIR(data);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes("irVersion"))).toBe(true);
  });

  test("wrong irVersion — invalid", () => {
    const data = {
      irVersion: 999,
      module: { name: "Test", globals: [], procedures: [], functions: [] },
    };
    const { valid } = validateIR(data);
    expect(valid).toBe(false);
  });

  test("additional property on stmt — invalid", () => {
    const data = {
      irVersion: 1,
      module: {
        name: "Test",
        globals: [],
        procedures: [],
        functions: [{
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
        globals: [],
        procedures: [],
        functions: [{
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
        globals: [],
        procedures: [],
        functions: [{
          kind: "function",
          name: "f",
          export: false,
          params: [],
          body: [
            { kind: "return", value: { kind: "number", value: 42 } },
          ],
        }],
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
        globals: [],
        procedures: [],
        functions: [{
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
        globals: [],
        procedures: [],
        functions: [{
          kind: "function",
          name: "loop",
          export: false,
          params: [],
          body: [
            {
              kind: "foreach",
              item: "Стр",
              collection: { kind: "variable", name: "Товары" },
              body: [
                { kind: "continue" },
              ],
            },
            { kind: "return", value: { kind: "number", value: 0 } },
          ],
        }],
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
        globals: [],
        procedures: [{
          kind: "procedure",
          name: "p",
          export: false,
          params: [],
          body: [
            { kind: "return" },
          ],
        }],
        functions: [],
      },
    };
    const { valid, errors } = validateIR(data);
    expect({ valid, errors }).toEqual({ valid: true, errors: [] });
  });
});
