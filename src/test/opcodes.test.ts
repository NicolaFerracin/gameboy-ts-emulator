import { CPU } from "../cpu";
import { Memory } from "../memory";

function createCPUWithROM(rom: number[]): CPU {
  const memory = new Memory(new Uint8Array(0x8000).map((_, i) => rom[i] ?? 0));
  const cpu = new CPU(memory);
  return cpu;
}

describe("Opcode tests: LD r, d8 and LD r1, r2", () => {
  test.each([
    [0x06, "_B"],
    [0x0e, "_C"],
    [0x16, "_D"],
    [0x1e, "_E"],
    [0x26, "_H"],
    [0x2e, "_L"],
    [0x3e, "_A"],
  ])("LD %s: loads immediate value into correct register", (opcode, reg) => {
    const value = 0xab;
    const cpu = createCPUWithROM([opcode, value]);
    cpu.tick();
    expect((cpu as any)[reg]).toBe(value);
  });

  test.each([
    [0x78, "_A", "_B"],
    [0x79, "_A", "_C"],
    [0x7a, "_A", "_D"],
    [0x7b, "_A", "_E"],
    [0x7c, "_A", "_H"],
    [0x7d, "_A", "_L"],
    [0x7f, "_A", "_A"],
    [0x41, "_B", "_C"],
    [0x42, "_B", "_D"],
    [0x43, "_B", "_E"],
    [0x44, "_B", "_H"],
    [0x45, "_B", "_L"],
    [0x47, "_B", "_A"],
    [0x48, "_C", "_B"],
    [0x4a, "_C", "_D"],
    [0x4b, "_C", "_E"],
    [0x4c, "_C", "_H"],
    [0x4d, "_C", "_L"],
    [0x4f, "_C", "_A"],
    [0x50, "_D", "_B"],
    [0x51, "_D", "_C"],
    [0x53, "_D", "_E"],
    [0x54, "_D", "_H"],
    [0x55, "_D", "_L"],
    [0x57, "_D", "_A"],
    [0x58, "_E", "_B"],
    [0x59, "_E", "_C"],
    [0x5a, "_E", "_D"],
    [0x5c, "_E", "_H"],
    [0x5d, "_E", "_L"],
    [0x5f, "_E", "_A"],
    [0x60, "_H", "_B"],
    [0x61, "_H", "_C"],
    [0x62, "_H", "_D"],
    [0x63, "_H", "_E"],
    [0x65, "_H", "_L"],
    [0x67, "_H", "_A"],
    [0x68, "_L", "_B"],
    [0x69, "_L", "_C"],
    [0x6a, "_L", "_D"],
    [0x6b, "_L", "_E"],
    [0x6c, "_L", "_H"],
    [0x6f, "_L", "_A"],
  ])("LD %s: copies register values correctly", (opcode, dst, src) => {
    const cpu = createCPUWithROM([opcode]);
    (cpu as any)[src] = 0x42;
    cpu.tick();
    expect((cpu as any)[dst]).toBe(0x42);
  });

  test("NOP (0x00) does not change state", () => {
    const cpu = createCPUWithROM([0x00]);
    const before = {
      PC: cpu.PC,
      A: cpu.A,
      B: cpu.B,
    };
    cpu.tick();
    expect(cpu.PC).toBe(before.PC + 1); // PC should advance
    expect(cpu.A).toBe(before.A);
    expect(cpu.B).toBe(before.B);
  });

  test("LD A, A is a NOP", () => {
    const cpu = createCPUWithROM([0x3e, 0x55, 0x7f]);
    cpu.tick(); // LD A, d8 (0x55)
    expect(cpu.A).toBe(0x55);
    cpu.tick(); // LD A, A
    expect(cpu.A).toBe(0x55); // should still be 0x55
  });

  test("Flag setters correctly modify F register", () => {
    const cpu = createCPUWithROM([]);

    cpu.Z_FLAG = true;
    expect(cpu.F & 0b10000000).toBe(0b10000000);

    cpu.N_FLAG = true;
    expect(cpu.F & 0b01000000).toBe(0b01000000);

    cpu.H_FLAG = true;
    expect(cpu.F & 0b00100000).toBe(0b00100000);

    cpu.C_FLAG = true;
    expect(cpu.F & 0b00010000).toBe(0b00010000);

    // Lower 4 bits should still be 0
    expect(cpu.F & 0x0f).toBe(0);

    // Turn some off
    cpu.Z_FLAG = false;
    cpu.H_FLAG = false;

    expect(cpu.F & 0b10000000).toBe(0); // Z off
    expect(cpu.F & 0b00100000).toBe(0); // H off
    expect(cpu.F & 0b01000000).toBe(0b01000000); // N still on
    expect(cpu.F & 0b00010000).toBe(0b00010000); // C still on
  });
});
