import { Memory } from "./memory.ts";
import { PPU } from "./ppu.ts";
import { GBScreen } from "./screen.ts";

export class Renderer {
  private _mem: Memory;
  private _ppu: PPU;
  private _screen: GBScreen;
  private _buf: Uint8Array;

  constructor(mem: Memory, ppu: PPU, screen: GBScreen) {
    this._mem = mem;
    this._ppu = ppu;
    this._screen = screen;
    this._buf = new Uint8Array(160 * 144);
  }

  renderScanline(ly: number) {
    if (ly < 0 || ly >= 144) return; // only visible lines

    // fake line
    for (let i = 0; i < 160; i++) {
      const index = ly * 160 + i;
      this._buf[ly * 160 + i] = Math.floor(Math.random() * 3);

      if (index === 144 * 160 - 1) this._screen.print(this._buf);
    }
  }
}
