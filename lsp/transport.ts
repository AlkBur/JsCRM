// stdio JSON-RPC transport for LSP.
//
// Reads Content-Length headers + JSON body from stdin.
// Writes the same format to stdout.
// Stderr is reserved for logging.

import { readSync, writeSync } from "fs";

function readStdin(): Buffer {
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(4096);
  let header = "";
  let bodyLength = -1;

  while (true) {
    const n = readSync(process.stdin.fd, buf, 0, buf.length, null);
    if (n <= 0) break;
    const chunk = buf.subarray(0, n);
    chunks.push(chunk);

    const full = Buffer.concat(chunks).toString("utf8");
    if (bodyLength < 0) {
      const idx = full.indexOf("\r\n\r\n");
      if (idx >= 0) {
        header = full.slice(0, idx);
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (match && match[1] !== undefined) bodyLength = parseInt(match[1], 10);
        const remaining = full.slice(idx + 4);
        if (remaining.length >= bodyLength) {
          return Buffer.from(remaining.slice(0, bodyLength), "utf8");
        }
        chunks.length = 0;
        chunks.push(Buffer.from(remaining.slice(bodyLength), "utf8"));
      }
    } else {
      const fullStr = full;
      if (fullStr.length >= bodyLength) {
        return Buffer.from(fullStr.slice(0, bodyLength), "utf8");
      }
    }
  }

  return Buffer.alloc(0);
}

export function readMessage(): Promise<{
  id?: number;
  method: string;
  params: unknown;
}> {
  return new Promise((resolve, reject) => {
    try {
      const raw = readStdin();
      if (raw.length === 0) {
        process.exit(0);
      }
      const msg = JSON.parse(raw.toString("utf8"));
      resolve(msg);
    } catch (e) {
      reject(e);
    }
  });
}

export function writeMessage(
  id: number | null,
  result: unknown,
  error?: unknown,
): void {
  const body = JSON.stringify(error ? { id, error } : { id, result });
  const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
  writeSync(process.stdout.fd, Buffer.from(header + body, "utf8"));
}

export function writeLog(msg: string): void {
  writeSync(process.stderr.fd, Buffer.from(msg + "\n", "utf8"));
}
