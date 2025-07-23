import { CPU } from "../cpu.ts";

describe("CPU Register Access", () => {
  let cpu: CPU;

  beforeEach(() => {
    cpu = new CPU();
  });

  test("8-bit register masking (A)", () => {
    cpu.A = 0x123; // 291
    expect(cpu.A).toBe(0x23); // 35
  });

  test("8-bit register masking (B)", () => {
    cpu.B = 0x1ff;
    expect(cpu.B).toBe(0xff);
  });

  test("F register masks to 0xF0", () => {
    cpu.F = 0xff;
    expect(cpu.F).toBe(0xf0);
  });

  test("16-bit register AF correctly combines A and F", () => {
    cpu.A = 0x12;
    cpu.F = 0xb0;
    expect(cpu.AF).toBe(0x12b0);
  });

  test("Setting AF splits correctly into A and F", () => {
    cpu.AF = 0x98a0;
    expect(cpu.A).toBe(0x98);
    expect(cpu.F).toBe(0xa0 & 0xf0);
  });

  test("Setting and reading HL works symmetrically", () => {
    cpu.HL = 0xabcd;
    expect(cpu.H).toBe(0xab);
    expect(cpu.L).toBe(0xcd);
    expect(cpu.HL).toBe(0xabcd);
  });

  test("SP and PC mask to 16-bit", () => {
    cpu.SP = 0x1ffff;
    cpu.PC = 0x123456;
    expect(cpu.SP).toBe(0xffff);
    expect(cpu.PC).toBe(0x3456);
  });
});
