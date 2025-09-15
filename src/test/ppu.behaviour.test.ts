import {
  HBLANK_MODE,
  INTERRUPT_FLAG_ADDR,
  LCDC_ADDR,
  LY_ADDR,
  LYC_ADDR,
  OAM_MODE,
  STAT_ADDR,
  TRANSFER_MODE,
  VBLANK_MODE,
} from "../constants.ts";
import { Memory } from "../memory.ts";
import { PPU } from "../ppu.ts";

/**
 * Standard harness: PPU first, attach to Memory, allocate reserved slice.
 * (This mirrors your new "PPU-first then attach" approach.)
 */
function makeHarness(lcdcOn = true) {
  const ppu = new PPU();
  const mem = new Memory(new Uint8Array(), ppu);

  if (lcdcOn) {
    mem.writeByte(LCDC_ADDR, 0x80); // LCDC.7 = 1
  } else {
    mem.writeByte(LCDC_ADDR, 0x00);
  }

  return { mem, ppu };
}

const readBit = (v: number, bit: number) => (v >> bit) & 1;

describe("PPU — MMIO basics", () => {
  test("FF44 (LY) mirrors internal LY; write to FF44 resets LY to 0", () => {
    const { mem, ppu } = makeHarness(true);

    // Advance two full lines: 2 * 456 dots
    ppu.tick(456 * 2);
    expect(mem.readByte(LY_ADDR)).toBe(2);

    // Any write to FF44 resets LY to 0 on DMG
    mem.writeByte(LY_ADDR, 0x99);
    expect(mem.readByte(LY_ADDR)).toBe(0);
  });

  test("FF41 (STAT) write only latches bits 3..6 (enables); 0..2 are live on read", () => {
    const { ppu } = makeHarness(true);

    // Nudge timing once so STAT.mode reflects reality
    ppu.tick(1);

    // Try to set enables to 1111 AND (incorrectly) lower bits — lower bits must be ignored.
    ppu._setStat(0b0111_1111);

    const stat = ppu._getStat();
    const enables = (stat >> 3) & 0b1111;
    const mode = stat & 0b11; // live mode on read

    expect(enables).toBe(0b1111);
    // At start of a visible line with LCD on, mode should be OAM (2)
    expect(mode).toBe(OAM_MODE);
  });

  test("FF41 (STAT) bit2 reflects LYC==LY live on read", () => {
    const { mem, ppu } = makeHarness(true);

    // Put LY=10
    ppu.tick(456 * 10);
    expect(mem.readByte(LY_ADDR)).toBe(10);

    // Set LYC != LY first
    mem.writeByte(LYC_ADDR, 9);
    let stat = mem.readByte(STAT_ADDR);
    expect(readBit(stat, 2)).toBe(0);

    // Now set LYC == LY
    mem.writeByte(LYC_ADDR, 10);
    stat = mem.readByte(STAT_ADDR);
    expect(readBit(stat, 2)).toBe(1);
  });

  test("LCDC.7 off freezes LY/dot and forces mode 0", () => {
    const { mem, ppu } = makeHarness(false);

    expect(mem.readByte(LY_ADDR)).toBe(0);
    // Burn time — should not advance
    ppu.tick(456 * 50);
    expect(mem.readByte(LY_ADDR)).toBe(0);

    // Turn on -> should start in Mode 2 at LY 0
    mem.writeByte(LCDC_ADDR, 0x80);
    ppu.tick(1);
    const stat = mem.readByte(STAT_ADDR);
    expect(stat & 0b11).toBe(OAM_MODE);
  });
});

describe("PPU — mode transitions & STAT.mode live bits", () => {
  test("Mode sequence within a visible line: 2 (0..79) -> 3 (80..251) -> 0 (252..455)", () => {
    const { mem, ppu } = makeHarness(true);

    // Start-of-line: OAM
    ppu.tick(1);
    expect(mem.readByte(STAT_ADDR) & 0b11).toBe(OAM_MODE);

    // Reach start of transfer at dot 80
    ppu.tick(79); // now dot=80
    expect(mem.readByte(STAT_ADDR) & 0b11).toBe(TRANSFER_MODE);

    // Reach HBlank at dot 252 (80 + 172 = 252)
    ppu.tick(172);
    expect(mem.readByte(STAT_ADDR) & 0b11).toBe(HBLANK_MODE);
  });

  test("End of HBlank advances to next line and re-enters Mode 2", () => {
    const { mem, ppu } = makeHarness(true);

    // Bring us to HBlank (dot 252)
    ppu.tick(80 + 172);
    expect(mem.readByte(STAT_ADDR) & 0b11).toBe(HBLANK_MODE);

    // Finish the line: +204 dots -> dot wraps to 0, LY++
    ppu.tick(204);
    expect(mem.readByte(LY_ADDR)).toBe(1);
    expect(mem.readByte(STAT_ADDR) & 0b11).toBe(OAM_MODE);
  });

  test("Entering VBlank at LY=144: STAT.mode=1 and IF bit0 set", () => {
    const { mem, ppu } = makeHarness(true);

    // Fast forward to start of VBlank (LY = 144)
    ppu.tick(456 * 144);

    const stat = mem.readByte(STAT_ADDR);
    expect(stat & 0b11).toBe(VBLANK_MODE);

    const IF = mem.readByte(INTERRUPT_FLAG_ADDR);
    expect(readBit(IF, 0)).toBe(1); // VBlank interrupt requested
  });
});

describe("PPU — STAT interrupts (IF bit1) on mode entry", () => {
  test("Mode 0 (HBlank) STAT interrupt fires on entry if bit3 enabled", () => {
    const { mem, ppu } = makeHarness(true);

    // Enable Mode 0 STAT interrupt (bit3)
    ppu._setStat(0b0000_1000);

    // Clear IF for clarity
    mem.writeByte(INTERRUPT_FLAG_ADDR, 0x00);

    // Enter HBlank: at dot 252
    ppu.tick(80 + 172);
    const IF = mem.readByte(INTERRUPT_FLAG_ADDR);
    expect(readBit(IF, 1)).toBe(1);
  });

  test("Mode 2 (OAM) STAT interrupt fires on entry at start of next line if bit5 enabled", () => {
    const { mem, ppu } = makeHarness(true);

    // Enable Mode 2 STAT interrupt (bit5)
    mem.writeByte(STAT_ADDR, 0b0010_0000);

    // Clear IF then finish a visible line to re-enter Mode 2
    mem.writeByte(INTERRUPT_FLAG_ADDR, 0x00);

    // Finish current line completely: 456 dots
    ppu.tick(456);

    const IF = mem.readByte(INTERRUPT_FLAG_ADDR);
    expect(readBit(IF, 1)).toBe(1);
  });

  test("Mode 1 (VBlank) STAT interrupt fires on entry if bit4 enabled (VBlank IF bit0 also set)", () => {
    const { mem, ppu } = makeHarness(true);

    // Enable Mode 1 STAT interrupt (bit4)
    mem.writeByte(STAT_ADDR, 0b0001_0000);

    mem.writeByte(INTERRUPT_FLAG_ADDR, 0x00);
    ppu.tick(456 * 144); // enter VBlank

    const IF = mem.readByte(INTERRUPT_FLAG_ADDR);
    expect(readBit(IF, 0)).toBe(1); // VBlank
    expect(readBit(IF, 1)).toBe(1); // STAT (Mode1)
  });
});
