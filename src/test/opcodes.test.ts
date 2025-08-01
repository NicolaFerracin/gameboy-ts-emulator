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

  test("0xF2: LD A, (C)", () => {
    const cpu = createCPUWithROM([0xf2]); // LD A, (C)
    cpu.C = 0x10;
    (cpu as any)._memory.writeByte(0xff10, 0x42);

    cpu.tick();

    expect(cpu.A).toBe(0x42);
  });

  test("0xE2: LD (C), A", () => {
    const cpu = createCPUWithROM([0xe2]); // LD (C), A
    cpu.C = 0x20;
    cpu.A = 0x88;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xff20)).toBe(0x88);
  });

  test("0x3A: LD A, (HL-)", () => {
    const cpu = createCPUWithROM([0x3a]); // LD A, (HL-)
    cpu.HL = 0xc123;
    (cpu as any)._memory.writeByte(0xc123, 0x7f);

    cpu.tick();

    expect(cpu.A).toBe(0x7f);
    expect(cpu.HL).toBe(0xc122);
  });

  test("0x22: LD (HL+), A", () => {
    const cpu = createCPUWithROM([0x22]); // LD (HL+), A
    cpu.HL = 0xc000;
    cpu.A = 0xab;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xc000)).toBe(0xab);
    expect(cpu.HL).toBe(0xc001);
  });

  test("0x2A: LD A, (HL+)", () => {
    const cpu = createCPUWithROM([0x2a]); // LD A, (HL+)
    cpu.HL = 0xc000;
    (cpu as any)._memory.writeByte(0xc000, 0x66);

    cpu.tick();

    expect(cpu.A).toBe(0x66);
    expect(cpu.HL).toBe(0xc001);
  });

  test("0x32: LD (HL-), A", () => {
    const cpu = createCPUWithROM([0x32]); // LD (HL-), A
    cpu.HL = 0xc100;
    cpu.A = 0x9f;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xc100)).toBe(0x9f);
    expect(cpu.HL).toBe(0xc0ff);
  });

  test("0xE0: LDH (a8), A", () => {
    const cpu = createCPUWithROM([0xe0, 0x50]); // LDH (0x50), A
    cpu.A = 0xde;

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xff50)).toBe(0xde);
  });

  test("0xF0: LDH A, (a8)", () => {
    const cpu = createCPUWithROM([0xf0, 0x77]); // LDH A, (0x77)
    (cpu as any)._memory.writeByte(0xff77, 0x33);

    cpu.tick();

    expect(cpu.A).toBe(0x33);
  });

  test("0x01: LD BC, d16", () => {
    const cpu = createCPUWithROM([0x01, 0x34, 0x12]); // LD BC, 0x1234

    cpu.tick();

    expect(cpu.BC).toBe(0x1234);
  });

  test("0x11: LD DE, d16", () => {
    const cpu = createCPUWithROM([0x11, 0x78, 0x56]); // LD DE, 0x5678

    cpu.tick();

    expect(cpu.DE).toBe(0x5678);
  });

  test("0x21: LD HL, d16", () => {
    const cpu = createCPUWithROM([0x21, 0xbc, 0x9a]); // LD HL, 0x9abc

    cpu.tick();

    expect(cpu.HL).toBe(0x9abc);
  });

  test("0x31: LD SP, d16", () => {
    const cpu = createCPUWithROM([0x31, 0xef, 0xcd]); // LD SP, 0xcdef

    cpu.tick();

    expect(cpu.SP).toBe(0xcdef);
  });

  test("0xF8: LD HL, SP+r8 (positive offset, no carries)", () => {
    const cpu = createCPUWithROM([0xf8, 0x05]); // LD HL, SP+5
    cpu.SP = 0xff00; // Low byte 0x00, so 0x00 + 0x05 = 0x05 (no carries)

    cpu.tick();

    expect(cpu.HL).toBe(0xff05);
    expect(cpu.SP).toBe(0xff00); // SP should remain unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag should be reset
    expect(cpu.F & 0x40).toBe(0); // N flag should be reset
    expect(cpu.F & 0x20).toBe(0); // H flag should be reset (no carry from bit 3)
    expect(cpu.F & 0x10).toBe(0); // C flag should be reset (no carry from bit 7)
  });

  test("0xF8: LD HL, SP+r8 (half carry)", () => {
    const cpu = createCPUWithROM([0xf8, 0x08]); // LD HL, SP+8
    cpu.SP = 0xff08; // Low byte 0x08, so 0x08 + 0x08 = 0x10 (carry from bit 3)

    cpu.tick();

    expect(cpu.HL).toBe(0xff10);
    expect(cpu.SP).toBe(0xff08); // SP should remain unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag should be reset
    expect(cpu.F & 0x40).toBe(0); // N flag should be reset
    expect(cpu.F & 0x20).toBe(0x20); // H flag should be set (carry from bit 3)
    expect(cpu.F & 0x10).toBe(0); // C flag should be reset (no carry from bit 7)
  });

  test("0xF8: LD HL, SP+r8 (carry)", () => {
    const cpu = createCPUWithROM([0xf8, 0x80]); // LD HL, SP+(-128)
    cpu.SP = 0xff80; // Low byte 0x80, so 0x80 + 0x80 = 0x100 (carry from bit 7)

    cpu.tick();

    expect(cpu.HL).toBe(0xff00); // 0x80 + 0x80 = 0x100, but only low byte kept
    expect(cpu.SP).toBe(0xff80); // SP should remain unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag should be reset
    expect(cpu.F & 0x40).toBe(0); // N flag should be reset
    expect(cpu.F & 0x20).toBe(0); // H flag should be reset
    expect(cpu.F & 0x10).toBe(0x10); // C flag should be set (carry from bit 7)
  });

  test("0xF8: LD HL, SP+r8 (negative offset)", () => {
    const cpu = createCPUWithROM([0xf8, 0xfe]); // LD HL, SP-2 (0xfe = -2 in signed 8-bit)
    cpu.SP = 0x1002; // Low byte 0x02, so 0x02 + 0xfe = 0x100 (carry from bit 7, underflow)

    cpu.tick();

    expect(cpu.HL).toBe(0x1000);
    expect(cpu.SP).toBe(0x1002); // SP should remain unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag should be reset
    expect(cpu.F & 0x40).toBe(0); // N flag should be reset
    expect(cpu.F & 0x20).toBe(0x20); // H flag should be set (borrow from bit 4)
    expect(cpu.F & 0x10).toBe(0x10); // C flag should be set (borrow from bit 8)
  });

  test("0xF8: LD HL, SP+r8 (zero offset)", () => {
    const cpu = createCPUWithROM([0xf8, 0x00]); // LD HL, SP+0
    cpu.SP = 0x8000;

    cpu.tick();

    expect(cpu.HL).toBe(0x8000);
    expect(cpu.F & 0x80).toBe(0); // Z flag should be reset
    expect(cpu.F & 0x40).toBe(0); // N flag should be reset
    expect(cpu.F & 0x20).toBe(0); // H flag should be reset
    expect(cpu.F & 0x10).toBe(0); // C flag should be reset
  });

  test("0xF9: LD SP, HL", () => {
    const cpu = createCPUWithROM([0xf9]); // LD SP, HL
    cpu.HL = 0xabcd;
    cpu.SP = 0x1234; // Initial SP value

    cpu.tick();

    expect(cpu.SP).toBe(0xabcd);
    expect(cpu.HL).toBe(0xabcd); // HL should remain unchanged
  });

  test("0xC1: POP BC", () => {
    const cpu = createCPUWithROM([0xc1]); // POP BC
    cpu.SP = 0xc000;
    // Set up stack data (little-endian: low byte first, then high byte)
    (cpu as any)._memory.writeByte(0xc000, 0x34); // Low byte of BC
    (cpu as any)._memory.writeByte(0xc001, 0x12); // High byte of BC

    cpu.tick();

    expect(cpu.BC).toBe(0x1234);
    expect(cpu.SP).toBe(0xc002); // SP incremented by 2
  });

  test("0xD1: POP DE", () => {
    const cpu = createCPUWithROM([0xd1]); // POP DE
    cpu.SP = 0xc100;
    (cpu as any)._memory.writeByte(0xc100, 0x78); // Low byte of DE
    (cpu as any)._memory.writeByte(0xc101, 0x56); // High byte of DE

    cpu.tick();

    expect(cpu.DE).toBe(0x5678);
    expect(cpu.SP).toBe(0xc102);
  });

  test("0xE1: POP HL", () => {
    const cpu = createCPUWithROM([0xe1]); // POP HL
    cpu.SP = 0xc200;
    (cpu as any)._memory.writeByte(0xc200, 0xbc); // Low byte of HL
    (cpu as any)._memory.writeByte(0xc201, 0x9a); // High byte of HL

    cpu.tick();

    expect(cpu.HL).toBe(0x9abc);
    expect(cpu.SP).toBe(0xc202);
  });

  test("0xF1: POP AF", () => {
    const cpu = createCPUWithROM([0xf1]); // POP AF
    cpu.SP = 0xc300;
    (cpu as any)._memory.writeByte(0xc300, 0xf0); // F register (flags)
    (cpu as any)._memory.writeByte(0xc301, 0xde); // A register

    cpu.tick();

    expect(cpu.A).toBe(0xde);
    expect(cpu.F).toBe(0xf0);
    expect(cpu.AF).toBe(0xdef0);
    expect(cpu.SP).toBe(0xc302);
  });

  // PUSH instructions - decrement SP and write to stack
  test("0xC5: PUSH BC", () => {
    const cpu = createCPUWithROM([0xc5]); // PUSH BC
    cpu.SP = 0xc004;
    cpu.BC = 0x1234;

    cpu.tick();

    expect(cpu.SP).toBe(0xc002); // SP decremented by 2
    expect((cpu as any)._memory.readByte(0xc002)).toBe(0x34); // Low byte
    expect((cpu as any)._memory.readByte(0xc003)).toBe(0x12); // High byte
    expect(cpu.BC).toBe(0x1234); // BC unchanged
  });

  test("0xD5: PUSH DE", () => {
    const cpu = createCPUWithROM([0xd5]); // PUSH DE
    cpu.SP = 0xc104;
    cpu.DE = 0x5678;

    cpu.tick();

    expect(cpu.SP).toBe(0xc102);
    expect((cpu as any)._memory.readByte(0xc102)).toBe(0x78); // Low byte
    expect((cpu as any)._memory.readByte(0xc103)).toBe(0x56); // High byte
    expect(cpu.DE).toBe(0x5678); // DE unchanged
  });

  test("0xE5: PUSH HL", () => {
    const cpu = createCPUWithROM([0xe5]); // PUSH HL
    cpu.SP = 0xc204;
    cpu.HL = 0x9abc;

    cpu.tick();

    expect(cpu.SP).toBe(0xc202);
    expect((cpu as any)._memory.readByte(0xc202)).toBe(0xbc); // Low byte
    expect((cpu as any)._memory.readByte(0xc203)).toBe(0x9a); // High byte
    expect(cpu.HL).toBe(0x9abc); // HL unchanged
  });

  test("0xF5: PUSH AF", () => {
    const cpu = createCPUWithROM([0xf5]); // PUSH AF
    cpu.SP = 0xc304;
    cpu.A = 0xde;
    cpu.F = 0xf0;

    cpu.tick();

    expect(cpu.SP).toBe(0xc302);
    expect((cpu as any)._memory.readByte(0xc302)).toBe(0xf0); // F register (low byte)
    expect((cpu as any)._memory.readByte(0xc303)).toBe(0xde); // A register (high byte)
    expect(cpu.A).toBe(0xde); // A unchanged
    expect(cpu.F).toBe(0xf0); // F unchanged
  });

  // Edge case: Stack wrapping
  test("POP BC with SP at 0xFFFE", () => {
    const cpu = createCPUWithROM([0xc1]); // POP BC
    cpu.SP = 0xfffe;
    (cpu as any)._memory.writeByte(0xfffe, 0xaa);
    (cpu as any)._memory.writeByte(0xffff, 0xbb);

    cpu.tick();

    expect(cpu.BC).toBe(0xbbaa);
    expect(cpu.SP).toBe(0x0000); // Wraps to 0x0000
  });

  test("PUSH BC with SP at 0x0002", () => {
    const cpu = createCPUWithROM([0xc5]); // PUSH BC
    cpu.SP = 0x0002;
    cpu.BC = 0x1122;

    cpu.tick();

    expect(cpu.SP).toBe(0x0000);
    expect((cpu as any)._memory.readByte(0x0000)).toBe(0x22); // Low byte
    expect((cpu as any)._memory.readByte(0x0001)).toBe(0x11); // High byte
  });

  // Test PUSH/POP pair to verify they're inverse operations
  test("PUSH then POP should restore original value", () => {
    const cpu = createCPUWithROM([0xc5, 0xc1]); // PUSH BC, POP BC
    cpu.SP = 0xc100;
    cpu.BC = 0xdead;
    const originalSP = cpu.SP;

    // First instruction: PUSH BC
    cpu.tick();
    expect(cpu.SP).toBe(originalSP - 2);
    expect((cpu as any)._memory.readByte(cpu.SP)).toBe(0xad);
    expect((cpu as any)._memory.readByte(cpu.SP + 1)).toBe(0xde);

    // Modify BC to prove POP restores it
    cpu.BC = 0x0000;

    // Second instruction: POP BC
    cpu.tick();
    expect(cpu.BC).toBe(0xdead); // Restored
    expect(cpu.SP).toBe(originalSP); // SP back to original
  });

  // ADD A, r - Add register to A (0x80-0x87)
  test("0x80: ADD A, B (no flags)", () => {
    const cpu = createCPUWithROM([0x80]); // ADD A, B
    cpu.A = 0x10;
    cpu.B = 0x05;
    cpu.F = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x15);
    expect(cpu.B).toBe(0x05); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x81: ADD A, C (zero result)", () => {
    const cpu = createCPUWithROM([0x81]); // ADD A, C
    cpu.A = 0x00;
    cpu.C = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00);
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x82: ADD A, D (half carry)", () => {
    const cpu = createCPUWithROM([0x82]); // ADD A, D
    cpu.A = 0x0f;
    cpu.D = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0x10);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 3)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x83: ADD A, E (carry)", () => {
    const cpu = createCPUWithROM([0x83]); // ADD A, E
    cpu.A = 0xff;
    cpu.E = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0x00);
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result is zero)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 3)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry from bit 7)
  });

  test("0x84: ADD A, H (half carry and carry)", () => {
    const cpu = createCPUWithROM([0x84]); // ADD A, H
    cpu.A = 0xff;
    cpu.H = 0xff;

    cpu.tick();

    expect(cpu.A).toBe(0xfe);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  test("0x85: ADD A, L", () => {
    const cpu = createCPUWithROM([0x85]); // ADD A, L
    cpu.A = 0x3c;
    cpu.L = 0x12;

    cpu.tick();

    expect(cpu.A).toBe(0x4e);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x86: ADD A, (HL)", () => {
    const cpu = createCPUWithROM([0x86]); // ADD A, (HL)
    cpu.A = 0x20;
    cpu.HL = 0xc100;
    (cpu as any)._memory.writeByte(0xc100, 0x15);

    cpu.tick();

    expect(cpu.A).toBe(0x35);
    expect((cpu as any)._memory.readByte(0xc100)).toBe(0x15); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x87: ADD A, A (double A)", () => {
    const cpu = createCPUWithROM([0x87]); // ADD A, A
    cpu.A = 0x40;

    cpu.tick();

    expect(cpu.A).toBe(0x80);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x87: ADD A, A (overflow to zero)", () => {
    const cpu = createCPUWithROM([0x87]); // ADD A, A
    cpu.A = 0x80;

    cpu.tick();

    expect(cpu.A).toBe(0x00);
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  // ADD A, d8 - Add immediate value to A (0xC6)

  test("0xC6: ADD A, d8 (no flags)", () => {
    const cpu = createCPUWithROM([0xc6, 0x25]); // ADD A, 0x25
    cpu.A = 0x10;

    cpu.tick();

    expect(cpu.A).toBe(0x35);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xC6: ADD A, d8 (zero result)", () => {
    const cpu = createCPUWithROM([0xc6, 0x00]); // ADD A, 0x00
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00);
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xC6: ADD A, d8 (half carry)", () => {
    const cpu = createCPUWithROM([0xc6, 0x08]); // ADD A, 0x08
    cpu.A = 0x08;

    cpu.tick();

    expect(cpu.A).toBe(0x10);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xC6: ADD A, d8 (carry)", () => {
    const cpu = createCPUWithROM([0xc6, 0x80]); // ADD A, 0x80
    cpu.A = 0x80;

    cpu.tick();

    expect(cpu.A).toBe(0x00);
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  test("0xC6: ADD A, d8 (both half carry and carry)", () => {
    const cpu = createCPUWithROM([0xc6, 0xff]); // ADD A, 0xFF
    cpu.A = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0x00);
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  // Edge cases
  test("ADD A operations clear previous flags", () => {
    const cpu = createCPUWithROM([0x80]); // ADD A, B
    cpu.A = 0x10;
    cpu.B = 0x05;
    cpu.F = 0xf0; // All flags initially set

    cpu.tick();

    expect(cpu.A).toBe(0x15);
    expect(cpu.F & 0x80).toBe(0); // Z flag cleared
    expect(cpu.F & 0x40).toBe(0); // N flag cleared (always 0 for ADD)
    expect(cpu.F & 0x20).toBe(0); // H flag cleared
    expect(cpu.F & 0x10).toBe(0); // C flag cleared
  });

  test("ADD A, (HL) with different memory values", () => {
    const cpu = createCPUWithROM([0x86]); // ADD A, (HL)
    cpu.A = 0x7f;
    cpu.HL = 0xc200;
    (cpu as any)._memory.writeByte(0xc200, 0x01);

    cpu.tick();

    expect(cpu.A).toBe(0x80);
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x7f + 0x01 carries from bit 3)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  // ADC A, r - Add register + carry to A (0x88-0x8F)

  test("0x88: ADC A, B (no carry flag set)", () => {
    const cpu = createCPUWithROM([0x88]); // ADC A, B
    cpu.A = 0x10;
    cpu.B = 0x05;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x15); // 0x10 + 0x05 + 0 = 0x15
    expect(cpu.B).toBe(0x05); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x88: ADC A, B (carry flag set)", () => {
    const cpu = createCPUWithROM([0x88]); // ADC A, B
    cpu.A = 0x10;
    cpu.B = 0x05;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x16); // 0x10 + 0x05 + 1 = 0x16
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x89: ADC A, C (zero result)", () => {
    const cpu = createCPUWithROM([0x89]); // ADC A, C
    cpu.A = 0x00;
    cpu.C = 0x00;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 + 0x00 + 0 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x89: ADC A, C (carry makes non-zero)", () => {
    const cpu = createCPUWithROM([0x89]); // ADC A, C
    cpu.A = 0x00;
    cpu.C = 0x00;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x01); // 0x00 + 0x00 + 1 = 0x01
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x8A: ADC A, D (half carry from register)", () => {
    const cpu = createCPUWithROM([0x8a]); // ADC A, D
    cpu.A = 0x0f;
    cpu.D = 0x00;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x10); // 0x0f + 0x00 + 1 = 0x10
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 3: 0xf + 1)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x8B: ADC A, E (half carry from both)", () => {
    const cpu = createCPUWithROM([0x8b]); // ADC A, E
    cpu.A = 0x08;
    cpu.E = 0x07;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x10); // 0x08 + 0x07 + 1 = 0x10
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x8 + 0x7 + 1 = 0x10)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x8C: ADC A, H (full carry)", () => {
    const cpu = createCPUWithROM([0x8c]); // ADC A, H
    cpu.A = 0xff;
    cpu.H = 0x00;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0xff + 0x00 + 1 = 0x100 -> 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  test("0x8D: ADC A, L (both half and full carry)", () => {
    const cpu = createCPUWithROM([0x8d]); // ADC A, L
    cpu.A = 0xff;
    cpu.L = 0xff;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0xff + 0xff + 1 = 0x1ff -> 0xff
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  test("0x8E: ADC A, (HL) (memory access)", () => {
    const cpu = createCPUWithROM([0x8e]); // ADC A, (HL)
    cpu.A = 0x20;
    cpu.HL = 0xc100;
    (cpu as any)._memory.writeByte(0xc100, 0x15);
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x36); // 0x20 + 0x15 + 1 = 0x36
    expect((cpu as any)._memory.readByte(0xc100)).toBe(0x15); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x8F: ADC A, A (double A plus carry)", () => {
    const cpu = createCPUWithROM([0x8f]); // ADC A, A
    cpu.A = 0x40;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x81); // 0x40 + 0x40 + 1 = 0x81
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x8F: ADC A, A (overflow with carry)", () => {
    const cpu = createCPUWithROM([0x8f]); // ADC A, A
    cpu.A = 0x80;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x01); // 0x80 + 0x80 + 1 = 0x101 -> 0x01
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  // ADC A, d8 - Add immediate value + carry to A (0xCE)

  test("0xCE: ADC A, d8 (no carry flag)", () => {
    const cpu = createCPUWithROM([0xce, 0x25]); // ADC A, 0x25
    cpu.A = 0x10;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x35); // 0x10 + 0x25 + 0 = 0x35
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xCE: ADC A, d8 (with carry flag)", () => {
    const cpu = createCPUWithROM([0xce, 0x25]); // ADC A, 0x25
    cpu.A = 0x10;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x36); // 0x10 + 0x25 + 1 = 0x36
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xCE: ADC A, d8 (carry creates half carry)", () => {
    const cpu = createCPUWithROM([0xce, 0x0e]); // ADC A, 0x0e
    cpu.A = 0x01;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x10); // 0x01 + 0x0e + 1 = 0x10
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x1 + 0xe + 1 = 0x10)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xCE: ADC A, d8 (all three create overflow)", () => {
    const cpu = createCPUWithROM([0xce, 0xff]); // ADC A, 0xff
    cpu.A = 0xff;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0xff + 0xff + 1 = 0x1ff -> 0xff
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  // Edge case: Carry flag influence
  test("ADC vs ADD comparison", () => {
    // Same values, but ADC has carry set
    const cpuAdd = createCPUWithROM([0x80]); // ADD A, B
    const cpuAdc = createCPUWithROM([0x88]); // ADC A, B

    cpuAdd.A = 0x10;
    cpuAdd.B = 0x05;
    cpuAdd.F = 0x10; // Carry set (but ADD ignores it)

    cpuAdc.A = 0x10;
    cpuAdc.B = 0x05;
    cpuAdc.F = 0x10; // Carry set (ADC uses it)

    cpuAdd.tick();
    cpuAdc.tick();

    expect(cpuAdd.A).toBe(0x15); // ADD: 0x10 + 0x05 = 0x15
    expect(cpuAdc.A).toBe(0x16); // ADC: 0x10 + 0x05 + 1 = 0x16
  });

  // SUB r - Subtract register from A (0x90-0x97)

  test("0x90: SUB B (no flags except N)", () => {
    const cpu = createCPUWithROM([0x90]); // SUB B
    cpu.A = 0x20;
    cpu.B = 0x10;

    cpu.tick();

    expect(cpu.A).toBe(0x10); // 0x20 - 0x10 = 0x10
    expect(cpu.B).toBe(0x10); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set (always for SUB)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (no full borrow)
  });

  test("0x91: SUB C (zero result)", () => {
    const cpu = createCPUWithROM([0x91]); // SUB C
    cpu.A = 0x15;
    cpu.C = 0x15;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x15 - 0x15 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result is zero)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x92: SUB D (half borrow)", () => {
    const cpu = createCPUWithROM([0x92]); // SUB D
    cpu.A = 0x20;
    cpu.D = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0x1f); // 0x20 - 0x01 = 0x1f
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (borrow: 0x0 - 0x1 needs borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x93: SUB E (full borrow)", () => {
    const cpu = createCPUWithROM([0x93]); // SUB E
    cpu.A = 0x10;
    cpu.E = 0x20;

    cpu.tick();

    expect(cpu.A).toBe(0xf0); // 0x10 - 0x20 = -0x10 = 0xf0 (in 8-bit)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0x0 - 0x0 = 0x0, no half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (full borrow: A < E)
  });

  test("0x94: SUB H (both half and full borrow)", () => {
    const cpu = createCPUWithROM([0x94]); // SUB H
    cpu.A = 0x00;
    cpu.H = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x00 - 0x01 = -1 = 0xff
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 - 0x1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (0x00 < 0x01, full borrow)
  });

  test("0x95: SUB L", () => {
    const cpu = createCPUWithROM([0x95]); // SUB L
    cpu.A = 0x3c;
    cpu.L = 0x12;

    cpu.tick();

    expect(cpu.A).toBe(0x2a); // 0x3c - 0x12 = 0x2a
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0xc - 0x2 = 0xa, no half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (0x3c > 0x12)
  });

  test("0x96: SUB (HL)", () => {
    const cpu = createCPUWithROM([0x96]); // SUB (HL)
    cpu.A = 0x35;
    cpu.HL = 0xc100;
    (cpu as any)._memory.writeByte(0xc100, 0x15);

    cpu.tick();

    expect(cpu.A).toBe(0x20); // 0x35 - 0x15 = 0x20
    expect((cpu as any)._memory.readByte(0xc100)).toBe(0x15); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x97: SUB A (always zero)", () => {
    const cpu = createCPUWithROM([0x97]); // SUB A
    cpu.A = 0x42;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // Any value - itself = 0
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (always zero)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half borrow when equal)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (no full borrow when equal)
  });

  // SUB d8 - Subtract immediate value from A (0xD6)

  test("0xD6: SUB d8 (no flags except N)", () => {
    const cpu = createCPUWithROM([0xd6, 0x15]); // SUB 0x15
    cpu.A = 0x35;

    cpu.tick();

    expect(cpu.A).toBe(0x20); // 0x35 - 0x15 = 0x20
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xD6: SUB d8 (zero result)", () => {
    const cpu = createCPUWithROM([0xd6, 0x50]); // SUB 0x50
    cpu.A = 0x50;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x50 - 0x50 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xD6: SUB d8 (half borrow)", () => {
    const cpu = createCPUWithROM([0xd6, 0x08]); // SUB 0x08
    cpu.A = 0x07;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x07 - 0x08 = -1 = 0xff
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x7 - 0x8 needs half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (0x07 < 0x08, full borrow)
  });

  test("0xD6: SUB d8 (only half borrow)", () => {
    const cpu = createCPUWithROM([0xd6, 0x01]); // SUB 0x01
    cpu.A = 0x10;

    cpu.tick();

    expect(cpu.A).toBe(0x0f); // 0x10 - 0x01 = 0x0f
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 - 0x1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (0x10 > 0x01)
  });

  // Edge cases
  test("SUB operations clear previous flags except N", () => {
    const cpu = createCPUWithROM([0x90]); // SUB B
    cpu.A = 0x20;
    cpu.B = 0x10;
    cpu.F = 0x90; // Z and C flags initially set

    cpu.tick();

    expect(cpu.A).toBe(0x10);
    expect(cpu.F & 0x80).toBe(0); // Z flag cleared
    expect(cpu.F & 0x40).toBe(0x40); // N flag set (always for SUB)
    expect(cpu.F & 0x20).toBe(0); // H flag cleared
    expect(cpu.F & 0x10).toBe(0); // C flag cleared
  });

  test("SUB with maximum values", () => {
    const cpu = createCPUWithROM([0xd6, 0xff]); // SUB 0xff
    cpu.A = 0xff;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0xff - 0xff = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half borrow when equal)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (no full borrow when equal)
  });
});
