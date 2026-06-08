// FormProjection — pure function that builds a filtered view of raw form data.
//
// Projection layers may degrade gracefully:
// commands and events with empty handlers are filtered out.
// Source data is never mutated.

import type { FormDocument, FormCommand, FormEvent } from "./form-types";

export function buildFormProjection(form: FormDocument): FormDocument {
  return {
    ...form,
    commands: form.commands.filter(hasHandler),
    events: form.events.filter(hasHandler),
  };
}

function hasHandler(c: FormCommand | FormEvent): boolean {
  return c.handler.trim() !== "";
}
