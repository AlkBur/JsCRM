export interface RuntimeObject {
  readonly typeName: string;
}

export type Value =
  | number
  | string
  | boolean
  | Date
  | null
  | undefined
  | RuntimeObject;
