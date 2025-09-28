import { Memory } from "./memory.ts";
import { PPU } from "./ppu.ts";
import { GBScreen } from "./screen.ts";
import { applyMask, applySign, getBitAtPos, u8Mask } from "./utils.ts";

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

    const isBgOn = this._ppu._isBgOn();
    const isWinOn = this._ppu._isWinOn();
    const scx = this._mem.getSCX(true);
    const scy = this._mem.getSCY(true);
    const bgMapBase = this._ppu.getBgMapBase(); // bit3
    const winMapBase = this._ppu.getWinMapBase(); // bit6
    const useUnsigned = this._ppu.isTileAddressingUnsigned(); // LCDC bit4
    const tileBase = useUnsigned ? 0x8000 : 0x9000;
    const wx = this._mem.readByte(0xff4b, true); // WX - window-specific
    const wy = this._mem.readByte(0xff4a, true); // WY - window-specific
    const bgp = this._mem.readByte(0xff47, true);

    for (let x = 0; x < 160; x++) {
      let useWindow = false;
      let tx = 0;
      let ty = 0;
      let mapBase = bgMapBase;
      // Window becomes active at x >= WX-7 and LY >= WY
      if (isWinOn && ly >= wy) {
        const winX = x - ((wx - 7) | 0);
        if (winX >= 0) {
          useWindow = true;
          tx = u8Mask(winX);
          ty = u8Mask(this._ppu.winLine);
          mapBase = winMapBase;
        }
      }
      if (!useWindow) {
        if (!isBgOn) {
          this.buf[ly * 160 + x] = 0;
          continue;
        }
        tx = u8Mask(x + scx);
        ty = u8Mask(ly + scy);
        mapBase = bgMapBase;
      }
      const tileCol = tx >>> 3; // equivalent to doing Math.floor(wx / 8) as we need to map the world x and y to the the 8x8 tiles
      const tileRow = ty >>> 3;
      const mapIndex = applyMask(tileRow * 32 + tileCol, 0x3ff);
      const tileId = this._mem.readByte(mapBase + mapIndex, true);
      const idx = useUnsigned ? tileId : applySign(tileId);
      const tileAdr = tileBase + idx * 16;
      const tileX = tx & 7; // equivalent to mapping the world y coordinate to the y within the single 8x8 tile
      const tileY = ty & 7;
      const lo = this._mem.readByte(tileAdr + (tileY << 1) + 0, true);
      const hi = this._mem.readByte(tileAdr + (tileY << 1) + 1, true);
      const bit = 7 - tileX;
      const c0 = getBitAtPos(lo, bit);
      const c1 = getBitAtPos(hi, bit);
      const colorId = (c1 << 1) | c0; // 0..3 from tile bitplanes
      const shade = (bgp >> (colorId * 2)) & 0b11;
      this.buf[ly * 160 + x] = shade; // renderer/screen maps 0..3 to RGBA
    }
  }

  present() {
    this._screen.present(this.buf);
  }
}
