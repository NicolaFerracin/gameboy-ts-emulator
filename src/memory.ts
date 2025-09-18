import {
  INTERRUPT_ENABLE_ADDR,
  INTERRUPT_FLAG_ADDR,
  PPU_RESERVED_MEMORY_END,
  PPU_RESERVED_MEMORY_START,
  SCX_ADDR,
  SCY_ADDR,
} from "./constants.ts";
import { PPU } from "./ppu.ts";
import { u16, u8 } from "./types";

export class Memory {
  private mem: Uint8Array;
  private _ppu: PPU | null = null;
  private isBiosEnabled: boolean;
  private gameRom: Uint8Array;
  private bootRom: Uint8Array;

  constructor(bootRom: Uint8Array, gameRom: Uint8Array, ppu: PPU) {
    // INITIALIAZE RAM
    this.mem = new Uint8Array(0x10000); // 64KB full address space

    // INITIALIZE GAME ROM
    this.gameRom = gameRom;

    // INITIALIZE BOOT ROM
    this.isBiosEnabled = true;
    this.bootRom = bootRom;

    // ATTACH MEMORY TO PPU
    this._ppu = ppu;
    this._ppu.allocateReservedMemory(
      this.mem.subarray(PPU_RESERVED_MEMORY_START, PPU_RESERVED_MEMORY_END + 1)
    );
    this._ppu.attachMemory(this);
  }

  readByte(addr: u16): u8 {
    if (!this._ppu) throw new Error("No PPU was attached to the Memory");
    if (this._ppu.isRervedAddr(addr)) return this._ppu.readByte(addr);
    if (addr < 0x8000) {
      if (this.isBiosEnabled && addr < this.bootRom.length)
        return this.bootRom[addr];
      if (addr < this.gameRom.length) return this.gameRom[addr];
      return 0xff;
    }
    return this.mem[addr] ?? 0xff;
  }

  writeByte(addr: u16, value: u8): void {
    if (!this._ppu) throw new Error("No PPU was attached to the Memory");
    if (this._ppu.isRervedAddr(addr)) {
      this._ppu.writeByte(addr, value);
      return;
    }
    // handles BIOS end
    if (addr === 0xff50 && this.isBiosEnabled && value !== 0x00) {
      this.isBiosEnabled = false;
      return;
    }

    if (addr < 0x8000) {
      // ROM/MBC write ignored for now
      return;
    }

    this.mem[addr] = value;
  }

  disableReadFromBoot() {
    this.isBiosEnabled = false;
  }

  // Who is allowed to interrupt
  getIE() {
    return this.readByte(INTERRUPT_ENABLE_ADDR);
  }

  // Who requested the interrupt
  getIF() {
    return this.readByte(INTERRUPT_FLAG_ADDR);
  }

  // Scroll X
  getSCX() {
    return this.readByte(SCX_ADDR);
  }

  // Scroll Y
  getSCY() {
    return this.readByte(SCY_ADDR);
  }
}
