export class RuntimeObject {
  private data: Record<string, any> = {};
  private listeners: Set<(field: string, value: any) => void> = new Set();

  get(field: string): any {
    return this.data[field];
  }

  set(field: string, value: any): void {
    this.data[field] = value;
    for (const listener of this.listeners) {
      listener(field, value);
    }
  }

  onChange(cb: (field: string, value: any) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  toJSON(): Record<string, any> {
    return { ...this.data };
  }

  load(data: Record<string, any>): void {
    this.data = { ...data };
  }
}
