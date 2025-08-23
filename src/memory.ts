import { u16, u8 } from "./types";

export class Memory {
  private mem: Uint8Array;
  private isBiosEnabled: boolean;

  constructor(bootRom: Uint8Array) {
    this.mem = new Uint8Array(0x10000); // 64KB full address space

    // INITIALIZE BOOT ROM
    this.isBiosEnabled = true;
    this.mem.set(bootRom, 0x0000);
  }

  readByte(addr: u16): u8 {
    return this.mem[addr];
  }

  writeByte(addr: u16, value: u8): void {
    // handles BIOS end
    if (addr === 0xff50 && this.isBiosEnabled && value !== 0x00) return;

    this.mem[addr] = value;
  }

  disableReadFromBoot() {
    this.isBiosEnabled = false;
  }
}
