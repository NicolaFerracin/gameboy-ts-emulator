import { Memory } from "./memory.ts";
import { PPU } from "./ppu.ts";
import { GBScreen } from "./screen.ts";
import { applySign, getBitAtPos, u8Mask } from "./utils.ts";

export class Renderer {
  private _mem: Memory;
  private _ppu: PPU;
  private _screen: GBScreen;
  buf: Uint8Array;

  constructor(mem: Memory, ppu: PPU, screen: GBScreen) {
    this._mem = mem;
    this._ppu = ppu;
    this._screen = screen;
    this.buf = new Uint8Array(160 * 144);

    // Attach Renderer to PPU
    this._ppu.attachRenderer(this);
  }

  renderScanline(ly: number) {
    if (ly < 0 || ly >= 144) return; // only visible lines

    const scx = this._mem.getSCX();
    const scy = this._mem.getSCY();
    const bgMapBase = this._ppu.getBgMapBase();
    const isTileAddressingUnsigned = this._ppu.isTileAddressingUnsigned();

    for (let x = 0; x < 160; x++) {
      const wx = u8Mask(x + scx);
      const wy = u8Mask(ly + scy);

      const tileCol = wx >>> 3; // equivalent to doing Math.floor(wx / 8) as we need to map the world x and y to the the 8x8 tiles
      const tileRow = wy >>> 3;
      const mapIndex = tileRow * 32 + tileCol;
      const tileId = this._mem.readByte(bgMapBase + mapIndex);
      const tileBase = isTileAddressingUnsigned
        ? 0x8000 + (tileId << 4)
        : 0x9000 + (applySign(tileId) << 4);

      const tileX = wx & 7; // equivalent to mapping the world y coordinate to the y within the single 8x8 tile
      const tileY = wy & 7;
      const lo = this._mem.readByte(tileBase + (tileY << 1) + 0);
      const hi = this._mem.readByte(tileBase + (tileY << 1) + 1);
      const bit = 7 - tileX;
      const c0 = getBitAtPos(lo, bit);
      const c1 = getBitAtPos(hi, bit);
      const colorId = (c1 << 1) | c0;
      this.buf[ly * 160 + x] = colorId;
    }
  }

  present() {
    this._screen.present(this.buf);
  }
}
