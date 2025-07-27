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

describe("CPU: INC r", () => {
  test("INC A: 0x0F -> 0x10", () => {
    const cpu = createCPUWithROM([0x3c]); // INC A
    cpu.A = 0x0f;
    cpu.tick();
    expect(cpu.A).toBe(0x10);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("INC B: 0xFF -> 0x00", () => {
    const cpu = createCPUWithROM([0x04]); // INC B
    cpu.B = 0xff;
    cpu.tick();
    expect(cpu.B).toBe(0x00);
    expect(cpu.Z_FLAG).toBe(true);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("INC C: 0x0F -> 0x10", () => {
    const cpu = createCPUWithROM([0x0c]); // INC C
    cpu.C = 0x0f;
    cpu.tick();
    expect(cpu.C).toBe(0x10);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("INC D: 0xFE -> 0xFF", () => {
    const cpu = createCPUWithROM([0x14]); // INC D
    cpu.D = 0xfe;
    cpu.tick();
    expect(cpu.D).toBe(0xff);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("INC E: 0x7F -> 0x80", () => {
    const cpu = createCPUWithROM([0x1c]); // INC E
    cpu.E = 0x7f;
    cpu.tick();
    expect(cpu.E).toBe(0x80);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("INC H: 0x0F -> 0x10", () => {
    const cpu = createCPUWithROM([0x24]); // INC H
    cpu.H = 0x0f;
    cpu.tick();
    expect(cpu.H).toBe(0x10);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("INC L: 0xFF -> 0x00", () => {
    const cpu = createCPUWithROM([0x2c]); // INC L
    cpu.L = 0xff;
    cpu.tick();
    expect(cpu.L).toBe(0x00);
    expect(cpu.Z_FLAG).toBe(true);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(true);
  });
});

describe("CPU: DEC r", () => {
  test("DEC A: 0x01 -> 0x00", () => {
    const cpu = createCPUWithROM([0x3d]); // DEC A
    cpu.A = 0x01;
    cpu.tick();
    expect(cpu.A).toBe(0x00);
    expect(cpu.Z_FLAG).toBe(true);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("DEC B: 0x10 -> 0x0F", () => {
    const cpu = createCPUWithROM([0x05]); // DEC B
    cpu.B = 0x10;
    cpu.tick();
    expect(cpu.B).toBe(0x0f);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("DEC C: 0x01 -> 0x00", () => {
    const cpu = createCPUWithROM([0x0d]); // DEC C
    cpu.C = 0x01;
    cpu.tick();
    expect(cpu.C).toBe(0x00);
    expect(cpu.Z_FLAG).toBe(true);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("DEC D: 0xF0 -> 0xEF", () => {
    const cpu = createCPUWithROM([0x15]); // DEC D
    cpu.D = 0xf0;
    cpu.tick();
    expect(cpu.D).toBe(0xef);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("DEC E: 0x00 -> 0xFF", () => {
    const cpu = createCPUWithROM([0x1d]); // DEC E
    cpu.E = 0x00;
    cpu.tick();
    expect(cpu.E).toBe(0xff);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(true);
  });

  test("DEC H: 0x01 -> 0x00", () => {
    const cpu = createCPUWithROM([0x25]); // DEC H
    cpu.H = 0x01;
    cpu.tick();
    expect(cpu.H).toBe(0x00);
    expect(cpu.Z_FLAG).toBe(true);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("DEC L: 0x10 -> 0x0F", () => {
    const cpu = createCPUWithROM([0x2d]); // DEC L
    cpu.L = 0x10;
    cpu.tick();
    expect(cpu.L).toBe(0x0f);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(true);
    expect(cpu.H_FLAG).toBe(true);
  });
});

describe("LD r, (HL) and LD (HL), r opcodes", () => {
  test("LD A, (HL)", () => {
    const cpu = createCPUWithROM([0x7e]); // LD A, (HL)
    cpu.H = 0x12;
    cpu.L = 0x34;
    (cpu as any)._memory.writeByte(0x1234, 0x56);

    cpu.tick();

    expect(cpu.A).toBe(0x56);
  });

  test("LD B, (HL)", () => {
    const cpu = createCPUWithROM([0x46]); // LD B, (HL)
    cpu.HL = 0x2000;
    (cpu as any)._memory.writeByte(0x2000, 0xaa);

    cpu.tick();

    expect(cpu.B).toBe(0xaa);
  });

  test("LD (HL), A", () => {
    const cpu = createCPUWithROM([0x77]); // LD (HL), A
    cpu.A = 0xbe;
    cpu.HL = 0xc000;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xc000)).toBe(0xbe);
  });

  test("LD (HL), B", () => {
    const cpu = createCPUWithROM([0x70]); // LD (HL), B
    cpu.B = 0x44;
    cpu.H = 0x99;
    cpu.L = 0x88;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0x9988)).toBe(0x44);
  });

  test("LD (HL), d8", () => {
    const cpu = createCPUWithROM([0x36, 0xde]); // LD (HL), 0xDE
    cpu.HL = 0x8000;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0x8000)).toBe(0xde);
  });

  test("0x0A: LD A, (BC)", () => {
    const cpu = createCPUWithROM([0x0a]); // LD A, (BC)
    cpu.BC = 0x1234;
    (cpu as any)._memory.writeByte(0x1234, 0xbe);
    cpu.tick();
    expect(cpu.A).toBe(0xbe);
  });

  test("0x1A: LD A, (DE)", () => {
    const cpu = createCPUWithROM([0x1a]); // LD A, (DE)
    cpu.DE = 0xabcd;
    (cpu as any)._memory.writeByte(0xabcd, 0x42);
    cpu.tick();
    expect(cpu.A).toBe(0x42);
  });

  test("0xFA: LD A, (a16)", () => {
    const cpu = createCPUWithROM([0xfa, 0x00, 0xc0]); // LD A, (0xc000)
    (cpu as any)._memory.writeByte(0xc000, 0x77);
    cpu.tick();
    expect(cpu.A).toBe(0x77);
  });

  test("0xEA: LD (a16), A", () => {
    const cpu = createCPUWithROM([0xea, 0x00, 0xc0]); // LD (0xc000), A
    cpu.A = 0x99;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xc000)).toBe(0x99);
  });
});
