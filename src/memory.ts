import {
  INTERRUPT_ENABLE_ADDR,
  INTERRUPT_FLAG_ADDR,
  PPU_RESERVED_MEMORY_END,
  PPU_RESERVED_MEMORY_START,
} from "./constants.ts";
import { PPU } from "./ppu.ts";
import { u16, u8 } from "./types";

export class Memory {
  private mem: Uint8Array;
  private _ppu: PPU | null = null;
  private isBiosEnabled: boolean;

  constructor(bootRom: Uint8Array, ppu: PPU) {
    this.mem = new Uint8Array(0x10000); // 64KB full address space

    // INITIALIZE BOOT ROM
    this.isBiosEnabled = true;
    this.mem.set(bootRom, 0x0000);

    // ATTACH MEMORY TO PPU
    this._ppu = ppu;
    this._ppu.attachMemory(
      this.mem.slice(PPU_RESERVED_MEMORY_START, PPU_RESERVED_MEMORY_END)
    );
  }

  readByte(addr: u16): u8 {
    if (!this._ppu) throw new Error("No PPU was attached to the Memory");
    if (this._ppu.isRervedAddr(addr)) return this._ppu.readByte(addr);
    return this.mem[addr];
  }

  writeByte(addr: u16, value: u8): void {
    if (!this._ppu) throw new Error("No PPU was attached to the Memory");
    if (this._ppu.isRervedAddr(addr)) this._ppu.writeByte(addr, value);
    // handles BIOS end
    else if (addr === 0xff50 && this.isBiosEnabled && value !== 0x00) return;

    this.mem[addr] = value;
  }

  disableReadFromBoot() {
    this.isBiosEnabled = false;
  }

  getIE() {
    return this.readByte(INTERRUPT_ENABLE_ADDR);
  }

  getIF() {
    return this.readByte(INTERRUPT_FLAG_ADDR);
  }
}
