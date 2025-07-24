import { u16, u8 } from "./types";

export class Memory {
  private _rom: Uint8Array;

  constructor(rom: Uint8Array) {
    this._rom = rom;
  }

  readByte(addr: u16): u8 {
    return this._rom[addr];
  }
}
