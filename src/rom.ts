import { readFile } from "fs/promises";

export async function loadROM(path: string): Promise<Uint8Array> {
  const buffer = await readFile(path);
  console.log(`Loaded ROM (${buffer.length} bytes)`);

  // Using TypedArray has many benefits:
  // - they work exactly like the hardware memory works, with 1-byte chunks
  // - it performs automatic wrapping of out-of-bounds values (i.e. arr[x] = 257 becomes 2 (257%255))
  return new Uint8Array(buffer);
}
