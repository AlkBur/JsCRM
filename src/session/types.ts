export interface Session {
  id: string;
  userId?: string;
  mode: "runtime" | "designer";
}
