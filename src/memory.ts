import { u16, u8 } from "./types";

export class Memory {
  private mem: Uint8Array;

  constructor(rom: Uint8Array) {
    this.mem = new Uint8Array(0x10000); // 64KB full address space
    this.mem.set(rom, 0x0000); // map ROM at start
  }

  readByte(addr: u16): u8 {
    return this.mem[addr];
  }

  writeByte(addr: u16, value: u8): void {
    this.mem[addr] = value;
  }
}
