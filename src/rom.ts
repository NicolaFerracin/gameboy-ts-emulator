export async function loadROM(pathOrUrl: string): Promise<Uint8Array> {
  // Browser path
  if (typeof window !== "undefined") {
    const res = await fetch(pathOrUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${pathOrUrl}: ${res.status}`);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  // Node path (tests/CLI)
  const { readFile } = await import("fs/promises");
  const buf = await readFile(pathOrUrl);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
