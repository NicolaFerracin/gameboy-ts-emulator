import { Memory } from "../memory.ts";
import { PPU } from "../ppu.ts";

const LCDC = 0xff40;
const STAT = 0xff41;
const LY = 0xff44;
const LYC = 0xff45;

function make() {
  const ppu = new PPU();
  const mem = new Memory(new Uint8Array(), ppu);
  return { mem, ppu };
}

/**
 * Assumptions for these tests (DMG behavior):
 * - FF44 (LY) is a read mirror of the PPU's internal LY; write resets LY to 0.
 * - FF45 (LYC) is writable; STAT coincidence (bit 2) reflects (LY == LYC).
 * - FF41 (STAT) read is composed: [bits6..3 latched enables] | [bit2 coincidence] | [bits1..0 mode]
 *   Writes to FF41 only change bits 3..6 (enables); writes to 0..2 are ignored.
 */
describe("PPU MMIO: FF40–FF45", () => {
  test("FF44 mirrors internal LY; write to FF44 resets LY", () => {
    const { mem, ppu } = make();

    // Turn LCD on (bit 7) so timing advances
    mem.writeByte(LCDC, 0x80);

    // Advance 2 full scanlines (912 dots)
    ppu.tick(456 * 2);
    expect(mem.readByte(LY)).toBe(2);

    // Writing FF44 resets LY to 0
    mem.writeByte(LY, 0x99); // value ignored; write triggers reset
    expect(mem.readByte(LY)).toBe(0);
  });

  test("FF45 write sets LYC; STAT bit2 reflects coincidence (LY==LYC)", () => {
    const { mem, ppu } = make();
    mem.writeByte(LCDC, 0x80);

    // Put LY at 5
    ppu.tick(456 * 5);
    expect(mem.readByte(LY)).toBe(5);

    // Set LYC = 10 -> not equal yet
    mem.writeByte(LYC, 10);
    const stat1 = mem.readByte(STAT);
    expect((stat1 >> 2) & 1).toBe(0); // coincidence flag

    // Advance to LY=10
    ppu.tick(456 * 5);
    expect(mem.readByte(LY)).toBe(10);

    const stat2 = mem.readByte(STAT);
    expect((stat2 >> 2) & 1).toBe(1); // coincidence now true
  });

  test("FF41 read: mode (0..1), coincidence bit, latched enable bits composed correctly", () => {
    const { mem } = make();
    mem.writeByte(LCDC, 0x80); // start PPU in Mode 2 at LY0

    // At start: LY=0, Mode=2 (OAM), not coincident unless LYC==0
    mem.writeByte(LYC, 99);
    let stat = mem.readByte(STAT);

    const mode = stat & 0b11;
    const coincidence = (stat >> 2) & 1;
    const enables = (stat >> 3) & 0b1111;

    expect(mode).toBe(2);
    expect(coincidence).toBe(0);
    expect(enables).toBe(0); // default enables latched to 0 on reset
  });

  test("FF41 write only affects bits 3..6 (enables); writes to bits 0..2 ignored", () => {
    const { mem } = make();

    // Ensure PPU is running so mode is 2 (OAM) at LY=0
    mem.writeByte(LCDC, 0x80);

    // Try to set enables to 1111 and also (incorrectly) set low bits — low bits must be ignored.
    mem.writeByte(STAT, 0b0111_1111);

    const stat = mem.readByte(STAT);

    // Enables (bits 3..6) should latch to 1111
    const enables = (stat >> 3) & 0b1111;
    expect(enables).toBe(0b1111);

    // Mode (bits 0..1) is live — at start it should be 2 (OAM) with LCD on.
    const mode = stat & 0b11;
    expect(mode).toBe(2);
  });

  test("LCDC bit 7 off freezes: LY=0, mode=0, dot=0 and no advance", () => {
    const { mem, ppu } = make();

    // Ensure LCD is off
    mem.writeByte(LCDC, 0x00);
    expect(mem.readByte(LY)).toBe(0);

    // Tick a bunch; should not change LY
    ppu.tick(456 * 50);
    expect(mem.readByte(LY)).toBe(0);

    // Turn on; should start at Mode 2, LY 0
    mem.writeByte(LCDC, 0x80);
    const stat = mem.readByte(STAT);
    expect(stat & 0b11).toBe(2);
  });
});
