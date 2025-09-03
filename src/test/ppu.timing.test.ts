import { Memory } from "../memory.ts";
import { PPU } from "../ppu.ts";

const LCDC = 0xff40;

function makePPU(lcdcOn = true) {
  const mem = new Memory(new Uint8Array());
  if (lcdcOn) {
    // Turn LCD on: set bit 7
    mem.writeByte(LCDC, 0x80);
  } else {
    mem.writeByte(LCDC, 0x00);
  }
  return { ppu: new PPU(mem), mem };
}

describe("PPU timing skeleton", () => {
  test("initial state: LY=0, DOT=0, Mode=OAM (2) when LCD is ON", () => {
    const { ppu } = makePPU(true);
    expect(ppu._ly).toBe(0);
    expect(ppu._dot).toBe(0);
    expect(ppu._mode).toBe(2); // OAM
  });

  test("mode progression within a visible scanline (2->3->0) and line advance", () => {
    const { ppu } = makePPU(true);

    // Start of line 0: OAM
    expect(ppu._mode).toBe(2);

    // After 80 dots -> Pixel Transfer (Mode 3)
    ppu.tick(80);
    expect(ppu._ly).toBe(0);
    expect(ppu._dot).toBe(80);
    expect(ppu._mode).toBe(3);

    // After 172 more dots (total 252) -> HBlank (Mode 0)
    ppu.tick(172);
    expect(ppu._ly).toBe(0);
    expect(ppu._dot).toBe(252);
    expect(ppu._mode).toBe(0);

    // After 204 more dots -> end of line, LY increments, DOT wraps to 0, back to OAM
    ppu.tick(204);
    expect(ppu._ly).toBe(1);
    expect(ppu._dot).toBe(0);
    expect(ppu._mode).toBe(2);
  });

  test("crossing a mode boundary in one tick is handled", () => {
    const { ppu } = makePPU(true);
    // Put us at the last dot of Mode 2 (dot 79)
    ppu._dot = 79;
    expect(ppu._mode).toBe(2);

    // Tick 4 dots: should spend 1 dot finishing Mode 2, then 3 dots into Mode 3
    ppu.tick(4);
    expect(ppu._dot).toBe(83);
    expect(ppu._mode).toBe(3);
  });

  test("VBlank spans LY=144..153 and wraps to LY=0", () => {
    const { ppu } = makePPU(true);
    // Simulate full 144 visible lines (each 456 dots)
    ppu.tick(456 * 144);
    expect(ppu._ly).toBe(144);
    expect(ppu._mode).toBe(1); // VBlank

    // 10 VBlank lines -> 456 * 10 dots
    ppu.tick(456 * 10);
    expect(ppu._ly).toBe(0);
    expect(ppu._dot).toBe(0);
    expect(ppu._mode).toBe(2); // back to OAM for the new frame
  });

  test("LCD off: ticking does not advance DOT/LY", () => {
    const { ppu } = makePPU(false); // LCDC.7 = 0
    expect(ppu._ly).toBe(0);
    expect(ppu._dot).toBe(0);
    const beforeLy = ppu._ly;
    const beforeDot = ppu._dot;
    ppu.tick(1000);
    expect(ppu._ly).toBe(beforeLy);
    expect(ppu._dot).toBe(beforeDot);
  });
});
