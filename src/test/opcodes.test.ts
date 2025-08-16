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
  // SBC A, r - Subtract register + carry from A (0x98-0x9F)

  test("0x98: SBC A, B (no carry flag set)", () => {
    const cpu = createCPUWithROM([0x98]); // SBC A, B
    cpu.A = 0x20;
    cpu.B = 0x10;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x10); // 0x20 - 0x10 - 0 = 0x10
    expect(cpu.B).toBe(0x10); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set (always for SBC)
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x98: SBC A, B (carry flag set)", () => {
    const cpu = createCPUWithROM([0x98]); // SBC A, B
    cpu.A = 0x20;
    cpu.B = 0x10;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x0f); // 0x20 - 0x10 - 1 = 0x0f
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 - 0x0 - 1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x99: SBC A, C (zero result)", () => {
    const cpu = createCPUWithROM([0x99]); // SBC A, C
    cpu.A = 0x15;
    cpu.C = 0x15;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x15 - 0x15 - 0 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x99: SBC A, C (carry makes negative)", () => {
    const cpu = createCPUWithROM([0x99]); // SBC A, C
    cpu.A = 0x15;
    cpu.C = 0x15;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x15 - 0x15 - 1 = -1 = 0xff
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (needs half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (needs full borrow)
  });

  test("0x9A: SBC A, D (half borrow from carry)", () => {
    const cpu = createCPUWithROM([0x9a]); // SBC A, D
    cpu.A = 0x10;
    cpu.D = 0x00;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x0f); // 0x10 - 0x00 - 1 = 0x0f
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 - 0x0 - 1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x9B: SBC A, E (half borrow from operand)", () => {
    const cpu = createCPUWithROM([0x9b]); // SBC A, E
    cpu.A = 0x20;
    cpu.E = 0x01;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x1f); // 0x20 - 0x01 - 0 = 0x1f
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 - 0x1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x9C: SBC A, H (full borrow)", () => {
    const cpu = createCPUWithROM([0x9c]); // SBC A, H
    cpu.A = 0x10;
    cpu.H = 0x20;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0xf0); // 0x10 - 0x20 - 0 = -0x10 = 0xf0
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0x0 - 0x0 = 0x0)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (full borrow needed)
  });

  test("0x9D: SBC A, L (carry causes extra borrow)", () => {
    const cpu = createCPUWithROM([0x9d]); // SBC A, L
    cpu.A = 0x11;
    cpu.L = 0x10;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x11 - 0x10 - 1 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x00); // H flag set (0x1 - 0x0 - 1 = 0x0, but needs borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x9E: SBC A, (HL) (memory access)", () => {
    const cpu = createCPUWithROM([0x9e]); // SBC A, (HL)
    cpu.A = 0x35;
    cpu.HL = 0xc100;
    (cpu as any)._memory.writeByte(0xc100, 0x15);
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x1f); // 0x35 - 0x15 - 1 = 0x1f
    expect((cpu as any)._memory.readByte(0xc100)).toBe(0x15); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x5 - 0x5 - 1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x9F: SBC A, A (with carry clear)", () => {
    const cpu = createCPUWithROM([0x9f]); // SBC A, A
    cpu.A = 0x42;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x42 - 0x42 - 0 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x9F: SBC A, A (with carry set)", () => {
    const cpu = createCPUWithROM([0x9f]); // SBC A, A
    cpu.A = 0x42;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x42 - 0x42 - 1 = -1 = 0xff
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (needs half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (needs full borrow)
  });

  // SBC A, d8 - Subtract immediate value + carry from A (0xDE)

  test("0xDE: SBC A, d8 (no carry flag)", () => {
    const cpu = createCPUWithROM([0xde, 0x15]); // SBC A, 0x15
    cpu.A = 0x35;
    cpu.F = 0x00; // Carry flag clear

    cpu.tick();

    expect(cpu.A).toBe(0x20); // 0x35 - 0x15 - 0 = 0x20
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xDE: SBC A, d8 (with carry flag)", () => {
    const cpu = createCPUWithROM([0xde, 0x15]); // SBC A, 0x15
    cpu.A = 0x35;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x1f); // 0x35 - 0x15 - 1 = 0x1f
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x5 - 0x5 - 1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xDE: SBC A, d8 (triple underflow)", () => {
    const cpu = createCPUWithROM([0xde, 0xff]); // SBC A, 0xff
    cpu.A = 0x00;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 - 0xff - 1 = -0x100 = 0x00 (wraps around)
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag clear (0x0 - 0xf - 1: complex case)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (massive underflow)
  });

  test("0xDE: SBC A, d8 (carry creates zero)", () => {
    const cpu = createCPUWithROM([0xde, 0x0f]); // SBC A, 0x0f
    cpu.A = 0x10;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x10 - 0x0f - 1 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 - 0xf - 1 needs half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  // Edge cases and comparisons
  test("SBC vs SUB comparison", () => {
    // Same values, but SBC has carry set
    const cpuSub = createCPUWithROM([0x90]); // SUB B
    const cpuSbc = createCPUWithROM([0x98]); // SBC A, B

    cpuSub.A = 0x20;
    cpuSub.B = 0x10;
    cpuSub.F = 0x10; // Carry set (but SUB ignores it)

    cpuSbc.A = 0x20;
    cpuSbc.B = 0x10;
    cpuSbc.F = 0x10; // Carry set (SBC uses it)

    cpuSub.tick();
    cpuSbc.tick();

    expect(cpuSub.A).toBe(0x10); // SUB: 0x20 - 0x10 = 0x10
    expect(cpuSbc.A).toBe(0x0f); // SBC: 0x20 - 0x10 - 1 = 0x0f
  });

  test("SBC extreme underflow", () => {
    const cpu = createCPUWithROM([0xde, 0x01]); // SBC A, 0x01
    cpu.A = 0x00;
    cpu.F = 0x10; // Carry flag set

    cpu.tick();

    expect(cpu.A).toBe(0xfe); // 0x00 - 0x01 - 1 = -2 = 0xfe
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0x10); // C flag set
  });

  // Test cases for Game Boy AND operations (0xA0-0xA7, 0xE6)

  test("0xA0: AND B", () => {
    const cpu = createCPUWithROM([0xa0]); // AND B
    cpu.A = 0x5a;
    cpu.B = 0x3f;

    cpu.tick();

    expect(cpu.A).toBe(0x1a); // 0x5A & 0x3F = 0x1A
    expect(cpu.B).toBe(0x3f); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (result != 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (always set for AND)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (always clear for AND)
  });

  test("0xA0: AND B (zero result)", () => {
    const cpu = createCPUWithROM([0xa0]); // AND B
    cpu.A = 0x55;
    cpu.B = 0xaa;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x55 & 0xAA = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA1: AND C", () => {
    const cpu = createCPUWithROM([0xa1]); // AND C
    cpu.A = 0xff;
    cpu.C = 0x0f;

    cpu.tick();

    expect(cpu.A).toBe(0x0f); // 0xFF & 0x0F = 0x0F
    expect(cpu.C).toBe(0x0f); // C unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA2: AND D", () => {
    const cpu = createCPUWithROM([0xa2]); // AND D
    cpu.A = 0xf0;
    cpu.D = 0x33;

    cpu.tick();

    expect(cpu.A).toBe(0x30); // 0xF0 & 0x33 = 0x30
    expect(cpu.D).toBe(0x33); // D unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA3: AND E", () => {
    const cpu = createCPUWithROM([0xa3]); // AND E
    cpu.A = 0x81;
    cpu.E = 0x7e;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x81 & 0x7E = 0x00
    expect(cpu.E).toBe(0x7e); // E unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA4: AND H", () => {
    const cpu = createCPUWithROM([0xa4]); // AND H
    cpu.A = 0xcc;
    cpu.H = 0x99;

    cpu.tick();

    expect(cpu.A).toBe(0x88); // 0xCC & 0x99 = 0x88
    expect(cpu.H).toBe(0x99); // H unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA5: AND L", () => {
    const cpu = createCPUWithROM([0xa5]); // AND L
    cpu.A = 0x3c;
    cpu.L = 0xc3;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x3C & 0xC3 = 0x00
    expect(cpu.L).toBe(0xc3); // L unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA6: AND (HL)", () => {
    const cpu = createCPUWithROM([0xa6]); // AND (HL)
    cpu.A = 0x7f;
    cpu.HL = 0xc200;
    (cpu as any)._memory.writeByte(0xc200, 0x1f);

    cpu.tick();

    expect(cpu.A).toBe(0x1f); // 0x7F & 0x1F = 0x1F
    expect((cpu as any)._memory.readByte(0xc200)).toBe(0x1f); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA7: AND A", () => {
    const cpu = createCPUWithROM([0xa7]); // AND A
    cpu.A = 0x42;

    cpu.tick();

    expect(cpu.A).toBe(0x42); // 0x42 & 0x42 = 0x42
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA7: AND A (zero case)", () => {
    const cpu = createCPUWithROM([0xa7]); // AND A
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 & 0x00 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xE6: AND d8", () => {
    const cpu = createCPUWithROM([0xe6, 0x0f]); // AND 0x0F
    cpu.A = 0x5a;

    cpu.tick();

    expect(cpu.A).toBe(0x0a); // 0x5A & 0x0F = 0x0A
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xE6: AND d8 (zero result)", () => {
    const cpu = createCPUWithROM([0xe6, 0x00]); // AND 0x00
    cpu.A = 0xff;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0xFF & 0x00 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xE6: AND d8 (all bits set)", () => {
    const cpu = createCPUWithROM([0xe6, 0xff]); // AND 0xFF
    cpu.A = 0x96;

    cpu.tick();

    expect(cpu.A).toBe(0x96); // 0x96 & 0xFF = 0x96
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  // Test cases for Game Boy OR operations (0xB0-0xB7, 0xF6)

  test("0xB0: OR B", () => {
    const cpu = createCPUWithROM([0xb0]); // OR B
    cpu.A = 0x5a;
    cpu.B = 0x3f;

    cpu.tick();

    expect(cpu.A).toBe(0x7f); // 0x5A | 0x3F = 0x7F
    expect(cpu.B).toBe(0x3f); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (result != 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear (always clear for OR)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (always clear for OR)
  });

  test("0xB0: OR B (zero result)", () => {
    const cpu = createCPUWithROM([0xb0]); // OR B
    cpu.A = 0x00;
    cpu.B = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 | 0x00 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB1: OR C", () => {
    const cpu = createCPUWithROM([0xb1]); // OR C
    cpu.A = 0xf0;
    cpu.C = 0x0f;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0xF0 | 0x0F = 0xFF
    expect(cpu.C).toBe(0x0f); // C unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB2: OR D", () => {
    const cpu = createCPUWithROM([0xb2]); // OR D
    cpu.A = 0x33;
    cpu.D = 0xcc;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x33 | 0xCC = 0xFF
    expect(cpu.D).toBe(0xcc); // D unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB3: OR E", () => {
    const cpu = createCPUWithROM([0xb3]); // OR E
    cpu.A = 0x81;
    cpu.E = 0x7e;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x81 | 0x7E = 0xFF
    expect(cpu.E).toBe(0x7e); // E unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB4: OR H", () => {
    const cpu = createCPUWithROM([0xb4]); // OR H
    cpu.A = 0x0c;
    cpu.H = 0x30;

    cpu.tick();

    expect(cpu.A).toBe(0x3c); // 0x0C | 0x30 = 0x3C
    expect(cpu.H).toBe(0x30); // H unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB5: OR L", () => {
    const cpu = createCPUWithROM([0xb5]); // OR L
    cpu.A = 0x55;
    cpu.L = 0xaa;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x55 | 0xAA = 0xFF
    expect(cpu.L).toBe(0xaa); // L unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB6: OR (HL)", () => {
    const cpu = createCPUWithROM([0xb6]); // OR (HL)
    cpu.A = 0x7f;
    cpu.HL = 0xc300;
    (cpu as any)._memory.writeByte(0xc300, 0x80);

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x7F | 0x80 = 0xFF
    expect((cpu as any)._memory.readByte(0xc300)).toBe(0x80); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB6: OR (HL) (zero result)", () => {
    const cpu = createCPUWithROM([0xb6]); // OR (HL)
    cpu.A = 0x00;
    cpu.HL = 0xc300;
    (cpu as any)._memory.writeByte(0xc300, 0x00);

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 | 0x00 = 0x00
    expect((cpu as any)._memory.readByte(0xc300)).toBe(0x00); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB7: OR A", () => {
    const cpu = createCPUWithROM([0xb7]); // OR A
    cpu.A = 0x42;

    cpu.tick();

    expect(cpu.A).toBe(0x42); // 0x42 | 0x42 = 0x42
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB7: OR A (zero case)", () => {
    const cpu = createCPUWithROM([0xb7]); // OR A
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 | 0x00 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xF6: OR d8", () => {
    const cpu = createCPUWithROM([0xf6, 0x0f]); // OR 0x0F
    cpu.A = 0x50;

    cpu.tick();

    expect(cpu.A).toBe(0x5f); // 0x50 | 0x0F = 0x5F
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xF6: OR d8 (zero result)", () => {
    const cpu = createCPUWithROM([0xf6, 0x00]); // OR 0x00
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 | 0x00 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xF6: OR d8 (all bits set)", () => {
    const cpu = createCPUWithROM([0xf6, 0xff]); // OR 0xFF
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x00 | 0xFF = 0xFF
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xF6: OR d8 (idempotent)", () => {
    const cpu = createCPUWithROM([0xf6, 0x96]); // OR 0x96
    cpu.A = 0x96;

    cpu.tick();

    expect(cpu.A).toBe(0x96); // 0x96 | 0x96 = 0x96
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  // Test cases for Game Boy XOR operations (0xA8-0xAF, 0xEE)

  test("0xA8: XOR B", () => {
    const cpu = createCPUWithROM([0xa8]); // XOR B
    cpu.A = 0x5a;
    cpu.B = 0x3f;

    cpu.tick();

    expect(cpu.A).toBe(0x65); // 0x5A ^ 0x3F = 0x65
    expect(cpu.B).toBe(0x3f); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (result != 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear (always clear for XOR)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (always clear for XOR)
  });

  test("0xA8: XOR B (zero result)", () => {
    const cpu = createCPUWithROM([0xa8]); // XOR B
    cpu.A = 0x55;
    cpu.B = 0x55;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x55 ^ 0x55 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xA9: XOR C", () => {
    const cpu = createCPUWithROM([0xa9]); // XOR C
    cpu.A = 0xf0;
    cpu.C = 0x0f;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0xF0 ^ 0x0F = 0xFF
    expect(cpu.C).toBe(0x0f); // C unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAA: XOR D", () => {
    const cpu = createCPUWithROM([0xaa]); // XOR D
    cpu.A = 0x33;
    cpu.D = 0xcc;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x33 ^ 0xCC = 0xFF
    expect(cpu.D).toBe(0xcc); // D unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAB: XOR E", () => {
    const cpu = createCPUWithROM([0xab]); // XOR E
    cpu.A = 0x81;
    cpu.E = 0x7e;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x81 ^ 0x7E = 0xFF
    expect(cpu.E).toBe(0x7e); // E unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAC: XOR H", () => {
    const cpu = createCPUWithROM([0xac]); // XOR H
    cpu.A = 0x0c;
    cpu.H = 0x30;

    cpu.tick();

    expect(cpu.A).toBe(0x3c); // 0x0C ^ 0x30 = 0x3C
    expect(cpu.H).toBe(0x30); // H unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAD: XOR L", () => {
    const cpu = createCPUWithROM([0xad]); // XOR L
    cpu.A = 0x55;
    cpu.L = 0xaa;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x55 ^ 0xAA = 0xFF
    expect(cpu.L).toBe(0xaa); // L unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAE: XOR (HL)", () => {
    const cpu = createCPUWithROM([0xae]); // XOR (HL)
    cpu.A = 0x7f;
    cpu.HL = 0xc400;
    (cpu as any)._memory.writeByte(0xc400, 0x80);

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x7F ^ 0x80 = 0xFF
    expect((cpu as any)._memory.readByte(0xc400)).toBe(0x80); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAE: XOR (HL) (zero result)", () => {
    const cpu = createCPUWithROM([0xae]); // XOR (HL)
    cpu.A = 0x42;
    cpu.HL = 0xc400;
    (cpu as any)._memory.writeByte(0xc400, 0x42);

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x42 ^ 0x42 = 0x00
    expect((cpu as any)._memory.readByte(0xc400)).toBe(0x42); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAF: XOR A", () => {
    const cpu = createCPUWithROM([0xaf]); // XOR A
    cpu.A = 0x42;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x42 ^ 0x42 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result always 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xAF: XOR A (already zero)", () => {
    const cpu = createCPUWithROM([0xaf]); // XOR A
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x00 ^ 0x00 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result always 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xEE: XOR d8", () => {
    const cpu = createCPUWithROM([0xee, 0x0f]); // XOR 0x0F
    cpu.A = 0x50;

    cpu.tick();

    expect(cpu.A).toBe(0x5f); // 0x50 ^ 0x0F = 0x5F
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xEE: XOR d8 (zero result)", () => {
    const cpu = createCPUWithROM([0xee, 0x96]); // XOR 0x96
    cpu.A = 0x96;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // 0x96 ^ 0x96 = 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xEE: XOR d8 (all bits flip)", () => {
    const cpu = createCPUWithROM([0xee, 0xff]); // XOR 0xFF
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0x00 ^ 0xFF = 0xFF
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xEE: XOR d8 (bit toggle)", () => {
    const cpu = createCPUWithROM([0xee, 0x55]); // XOR 0x55
    cpu.A = 0xaa;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // 0xAA ^ 0x55 = 0xFF
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });
  // Test cases for Game Boy CP (compare) operations (0xB8-0xBF, 0xFE)

  test("0xB8: CP B (A > B)", () => {
    const cpu = createCPUWithROM([0xb8]); // CP B
    cpu.A = 0x35;
    cpu.B = 0x15;

    cpu.tick();

    expect(cpu.A).toBe(0x35); // A unchanged
    expect(cpu.B).toBe(0x15); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (A != B)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set (subtraction operation)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (no borrow)
  });

  test("0xB8: CP B (A == B)", () => {
    const cpu = createCPUWithROM([0xb8]); // CP B
    cpu.A = 0x42;
    cpu.B = 0x42;

    cpu.tick();

    expect(cpu.A).toBe(0x42); // A unchanged
    expect(cpu.B).toBe(0x42); // B unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (A == B)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xB8: CP B (A < B)", () => {
    const cpu = createCPUWithROM([0xb8]); // CP B
    cpu.A = 0x15;
    cpu.B = 0x35;

    cpu.tick();

    expect(cpu.A).toBe(0x15); // A unchanged
    expect(cpu.B).toBe(0x35); // B unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (A != B)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half borrow: 0x5 >= 0x5)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow occurred)
  });

  test("0xB9: CP C", () => {
    const cpu = createCPUWithROM([0xb9]); // CP C
    cpu.A = 0xff;
    cpu.C = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // A unchanged
    expect(cpu.C).toBe(0x01); // C unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xBA: CP D", () => {
    const cpu = createCPUWithROM([0xba]); // CP D
    cpu.A = 0x10;
    cpu.D = 0x20;

    cpu.tick();

    expect(cpu.A).toBe(0x10); // A unchanged
    expect(cpu.D).toBe(0x20); // D unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0x0 >= 0x0, no half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow)
  });

  test("0xBB: CP E", () => {
    const cpu = createCPUWithROM([0xbb]); // CP E
    cpu.A = 0x80;
    cpu.E = 0x7f;

    cpu.tick();

    expect(cpu.A).toBe(0x80); // A unchanged
    expect(cpu.E).toBe(0x7f); // E unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xBC: CP H", () => {
    const cpu = createCPUWithROM([0xbc]); // CP H
    cpu.A = 0x20;
    cpu.H = 0x21;

    cpu.tick();

    expect(cpu.A).toBe(0x20); // A unchanged
    expect(cpu.H).toBe(0x21); // H unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x0 < 0x1, half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow)
  });

  test("0xBD: CP L", () => {
    const cpu = createCPUWithROM([0xbd]); // CP L
    cpu.A = 0x00;
    cpu.L = 0x01;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // A unchanged
    expect(cpu.L).toBe(0x01); // L unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow)
  });

  test("0xBE: CP (HL)", () => {
    const cpu = createCPUWithROM([0xbe]); // CP (HL)
    cpu.A = 0x50;
    cpu.HL = 0xc500;
    (cpu as any)._memory.writeByte(0xc500, 0x30);

    cpu.tick();

    expect(cpu.A).toBe(0x50); // A unchanged
    expect((cpu as any)._memory.readByte(0xc500)).toBe(0x30); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xBE: CP (HL) (equal values)", () => {
    const cpu = createCPUWithROM([0xbe]); // CP (HL)
    cpu.A = 0x88;
    cpu.HL = 0xc500;
    (cpu as any)._memory.writeByte(0xc500, 0x88);

    cpu.tick();

    expect(cpu.A).toBe(0x88); // A unchanged
    expect((cpu as any)._memory.readByte(0xc500)).toBe(0x88); // Memory unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (equal)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xBF: CP A", () => {
    const cpu = createCPUWithROM([0xbf]); // CP A
    cpu.A = 0x96;

    cpu.tick();

    expect(cpu.A).toBe(0x96); // A unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (always equal to itself)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xFE: CP d8 (A > immediate)", () => {
    const cpu = createCPUWithROM([0xfe, 0x30]); // CP 0x30
    cpu.A = 0x50;

    cpu.tick();

    expect(cpu.A).toBe(0x50); // A unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xFE: CP d8 (A == immediate)", () => {
    const cpu = createCPUWithROM([0xfe, 0x42]); // CP 0x42
    cpu.A = 0x42;

    cpu.tick();

    expect(cpu.A).toBe(0x42); // A unchanged
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (equal)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xFE: CP d8 (A < immediate)", () => {
    const cpu = createCPUWithROM([0xfe, 0x80]); // CP 0x80
    cpu.A = 0x7f;

    cpu.tick();

    expect(cpu.A).toBe(0x7f); // A unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x0); // H flag set (half borrow)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow)
  });

  test("0xFE: CP d8 (half borrow test)", () => {
    const cpu = createCPUWithROM([0xfe, 0x01]); // CP 0x01
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // A unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (half borrow from bit 4)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow occurred)
  });

  test("0xFE: CP d8 (no borrow)", () => {
    const cpu = createCPUWithROM([0xfe, 0x00]); // CP 0x00
    cpu.A = 0xff;

    cpu.tick();

    expect(cpu.A).toBe(0xff); // A unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half borrow)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (no borrow)
  });

  // Test cases for Game Boy 16-bit ADD HL operations (0x09, 0x19, 0x29, 0x39)

  test("0x09: ADD HL,BC", () => {
    const cpu = createCPUWithROM([0x09]); // ADD HL,BC
    cpu.HL = 0x1234;
    cpu.BC = 0x0567;

    cpu.tick();

    expect(cpu.HL).toBe(0x179b); // 0x1234 + 0x0567 = 0x179B
    expect(cpu.BC).toBe(0x0567); // BC unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag unchanged (not affected by 16-bit ADD)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear (no half carry from bit 11)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (no carry from bit 15)
  });

  test("0x09: ADD HL,BC (half carry)", () => {
    const cpu = createCPUWithROM([0x09]); // ADD HL,BC
    cpu.HL = 0x0fff;
    cpu.BC = 0x0001;

    cpu.tick();

    expect(cpu.HL).toBe(0x1000); // 0x0FFF + 0x0001 = 0x1000
    expect(cpu.BC).toBe(0x0001); // BC unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 11 to bit 12)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x09: ADD HL,BC (carry)", () => {
    const cpu = createCPUWithROM([0x09]); // ADD HL,BC
    cpu.HL = 0xffff;
    cpu.BC = 0x0001;

    cpu.tick();

    expect(cpu.HL).toBe(0x0000); // 0xFFFF + 0x0001 = 0x0000 (overflow)
    expect(cpu.BC).toBe(0x0001); // BC unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 11)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry from bit 15)
  });

  test("0x19: ADD HL,DE", () => {
    const cpu = createCPUWithROM([0x19]); // ADD HL,DE
    cpu.HL = 0x2000;
    cpu.DE = 0x1500;

    cpu.tick();

    expect(cpu.HL).toBe(0x3500); // 0x2000 + 0x1500 = 0x3500
    expect(cpu.DE).toBe(0x1500); // DE unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x19: ADD HL,DE (half carry)", () => {
    const cpu = createCPUWithROM([0x19]); // ADD HL,DE
    cpu.HL = 0x0800;
    cpu.DE = 0x0800;

    cpu.tick();

    expect(cpu.HL).toBe(0x1000); // 0x0800 + 0x0800 = 0x1000
    expect(cpu.DE).toBe(0x0800); // DE unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 11)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x19: ADD HL,DE (carry)", () => {
    const cpu = createCPUWithROM([0x19]); // ADD HL,DE
    cpu.HL = 0x8000;
    cpu.DE = 0x8000;

    cpu.tick();

    expect(cpu.HL).toBe(0x0000); // 0x8000 + 0x8000 = 0x0000 (overflow)
    expect(cpu.DE).toBe(0x8000); // DE unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry from bit 15)
  });

  test("0x29: ADD HL,HL", () => {
    const cpu = createCPUWithROM([0x29]); // ADD HL,HL (double HL)
    cpu.HL = 0x1234;

    cpu.tick();

    expect(cpu.HL).toBe(0x2468); // 0x1234 + 0x1234 = 0x2468
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x29: ADD HL,HL (half carry)", () => {
    const cpu = createCPUWithROM([0x29]); // ADD HL,HL
    cpu.HL = 0x0900;

    cpu.tick();

    expect(cpu.HL).toBe(0x1200); // 0x0900 + 0x0900 = 0x1200
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 11)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x29: ADD HL,HL (carry)", () => {
    const cpu = createCPUWithROM([0x29]); // ADD HL,HL
    cpu.HL = 0x9000;

    cpu.tick();

    expect(cpu.HL).toBe(0x2000); // 0x9000 + 0x9000 = 0x12000 -> 0x2000 (overflow)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry from bit 15)
  });

  test("0x39: ADD HL,SP", () => {
    const cpu = createCPUWithROM([0x39]); // ADD HL,SP
    cpu.HL = 0x3000;
    cpu.SP = 0x1000;

    cpu.tick();

    expect(cpu.HL).toBe(0x4000); // 0x3000 + 0x1000 = 0x4000
    expect(cpu.SP).toBe(0x1000); // SP unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x39: ADD HL,SP (half carry)", () => {
    const cpu = createCPUWithROM([0x39]); // ADD HL,SP
    cpu.HL = 0x0fff;
    cpu.SP = 0x0001;

    cpu.tick();

    expect(cpu.HL).toBe(0x1000); // 0x0FFF + 0x0001 = 0x1000
    expect(cpu.SP).toBe(0x0001); // SP unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 11)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x39: ADD HL,SP (carry)", () => {
    const cpu = createCPUWithROM([0x39]); // ADD HL,SP
    cpu.HL = 0xfffe;
    cpu.SP = 0x0002;

    cpu.tick();

    expect(cpu.HL).toBe(0x0000); // 0xFFFE + 0x0002 = 0x10000 -> 0x0000 (overflow)
    expect(cpu.SP).toBe(0x0002); // SP unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (carry from bit 11)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry from bit 15)
  });

  test("0x39: ADD HL,SP (zero result)", () => {
    const cpu = createCPUWithROM([0x39]); // ADD HL,SP
    cpu.HL = 0x0000;
    cpu.SP = 0x0000;

    cpu.tick();

    expect(cpu.HL).toBe(0x0000); // 0x0000 + 0x0000 = 0x0000
    expect(cpu.SP).toBe(0x0000); // SP unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x09: ADD HL,BC (Z flag preservation)", () => {
    const cpu = createCPUWithROM([0x09]); // ADD HL,BC
    cpu.HL = 0x1000;
    cpu.BC = 0x2000;
    cpu.F = 0x80; // Set Z flag initially

    cpu.tick();

    expect(cpu.HL).toBe(0x3000); // 0x1000 + 0x2000 = 0x3000
    expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved (not affected by 16-bit ADD)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x19: ADD HL,DE (complex half carry)", () => {
    const cpu = createCPUWithROM([0x19]); // ADD HL,DE
    cpu.HL = 0x0abc;
    cpu.DE = 0x0567;

    cpu.tick();

    expect(cpu.HL).toBe(0x1023); // 0x0ABC + 0x0567 = 0x1023
    expect(cpu.DE).toBe(0x0567); // DE unchanged
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0xABC + 0x567 = carry from bit 11)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  // Test cases for Game Boy 16-bit operations (0xE8, INC rr, DEC rr)

  // ADD SP,r8 (0xE8) - flags based on 8-bit arithmetic of SP low byte + immediate
  test("0xE8: ADD SP,r8 (positive immediate)", () => {
    const cpu = createCPUWithROM([0xe8, 0x05]); // ADD SP,+5
    cpu.SP = 0x1234;

    cpu.tick();

    expect(cpu.SP).toBe(0x1239); // 0x1234 + 5 = 0x1239
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (always clear for ADD SP,r8)
    expect(cpu.F & 0x40).toBe(0); // N flag clear (always clear for ADD SP,r8)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0x4 + 0x5 = 0x9, no carry from bit 3)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (0x34 + 0x05 = 0x39, no carry from bit 7)
  });

  test("0xE8: ADD SP,r8 (negative immediate)", () => {
    const cpu = createCPUWithROM([0xe8, 0xfe]); // ADD SP,-2 (0xFE = -2 in signed 8-bit)
    cpu.SP = 0x1234;

    cpu.tick();

    expect(cpu.SP).toBe(0x1232); // 0x1234 + (-2) = 0x1232
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0x4 + 0xE = 0x12, carry from bit 3)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (0x34 + 0xFE = 0x132, carry from bit 7)
  });

  test("0xE8: ADD SP,r8 (actual carry scenario)", () => {
    const cpu = createCPUWithROM([0xe8, 0x01]); // ADD SP,+1
    cpu.SP = 0x12ff;

    cpu.tick();

    expect(cpu.SP).toBe(0x1300); // 0x12FF + 1 = 0x1300
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0x20); // H flag set (0xF + 0x1 = 0x10, carry from bit 3)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (0xFF + 0x01 = 0x100, carry from bit 7)
  });

  test("0xE8: ADD SP,r8 (zero immediate)", () => {
    const cpu = createCPUWithROM([0xe8, 0x00]); // ADD SP,0
    cpu.SP = 0x5678;

    cpu.tick();

    expect(cpu.SP).toBe(0x5678); // 0x5678 + 0 = 0x5678
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0xE8: ADD SP,r8 (maximum negative)", () => {
    const cpu = createCPUWithROM([0xe8, 0x80]); // ADD SP,-128 (0x80 = -128 in signed 8-bit)
    cpu.SP = 0x1280;

    cpu.tick();

    expect(cpu.SP).toBe(0x1200); // 0x1280 + (-128) = 0x1200
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0x0 + 0x0 = 0x0, no carry from bit 3)
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (0x80 + 0x80 = 0x100, carry from bit 7)
  });

  // INC rr operations (0x03, 0x13, 0x23, 0x33) - no flags affected
  test("0x03: INC BC", () => {
    const cpu = createCPUWithROM([0x03]); // INC BC
    cpu.BC = 0x1234;
    cpu.F = 0xf0; // Set all flags initially

    cpu.tick();

    expect(cpu.BC).toBe(0x1235); // 0x1234 + 1 = 0x1235
    expect(cpu.F).toBe(0xf0); // All flags unchanged (INC rr doesn't affect flags)
  });

  test("0x03: INC BC (overflow)", () => {
    const cpu = createCPUWithROM([0x03]); // INC BC
    cpu.BC = 0xffff;
    cpu.F = 0x00; // Clear all flags initially

    cpu.tick();

    expect(cpu.BC).toBe(0x0000); // 0xFFFF + 1 = 0x0000 (wrap around)
    expect(cpu.F).toBe(0x00); // All flags unchanged
  });

  test("0x13: INC DE", () => {
    const cpu = createCPUWithROM([0x13]); // INC DE
    cpu.DE = 0xabcd;

    cpu.tick();

    expect(cpu.DE).toBe(0xabce); // 0xABCD + 1 = 0xABCE
  });

  test("0x23: INC HL", () => {
    const cpu = createCPUWithROM([0x23]); // INC HL
    cpu.HL = 0x00ff;

    cpu.tick();

    expect(cpu.HL).toBe(0x0100); // 0x00FF + 1 = 0x0100
  });

  test("0x33: INC SP", () => {
    const cpu = createCPUWithROM([0x33]); // INC SP
    cpu.SP = 0xfffe;

    cpu.tick();

    expect(cpu.SP).toBe(0xffff); // 0xFFFE + 1 = 0xFFFF
  });

  test("0x33: INC SP (wrap around)", () => {
    const cpu = createCPUWithROM([0x33]); // INC SP
    cpu.SP = 0xffff;

    cpu.tick();

    expect(cpu.SP).toBe(0x0000); // 0xFFFF + 1 = 0x0000 (wrap around)
  });

  // DEC rr operations (0x0B, 0x1B, 0x2B, 0x3B) - no flags affected
  test("0x0B: DEC BC", () => {
    const cpu = createCPUWithROM([0x0b]); // DEC BC
    cpu.BC = 0x1234;
    cpu.F = 0xf0; // Set all flags initially

    cpu.tick();

    expect(cpu.BC).toBe(0x1233); // 0x1234 - 1 = 0x1233
    expect(cpu.F).toBe(0xf0); // All flags unchanged (DEC rr doesn't affect flags)
  });

  test("0x0B: DEC BC (underflow)", () => {
    const cpu = createCPUWithROM([0x0b]); // DEC BC
    cpu.BC = 0x0000;
    cpu.F = 0x00; // Clear all flags initially

    cpu.tick();

    expect(cpu.BC).toBe(0xffff); // 0x0000 - 1 = 0xFFFF (wrap around)
    expect(cpu.F).toBe(0x00); // All flags unchanged
  });

  test("0x1B: DEC DE", () => {
    const cpu = createCPUWithROM([0x1b]); // DEC DE
    cpu.DE = 0xabcd;

    cpu.tick();

    expect(cpu.DE).toBe(0xabcc); // 0xABCD - 1 = 0xABCC
  });

  test("0x2B: DEC HL", () => {
    const cpu = createCPUWithROM([0x2b]); // DEC HL
    cpu.HL = 0x0100;

    cpu.tick();

    expect(cpu.HL).toBe(0x00ff); // 0x0100 - 1 = 0x00FF
  });

  test("0x3B: DEC SP", () => {
    const cpu = createCPUWithROM([0x3b]); // DEC SP
    cpu.SP = 0x0001;

    cpu.tick();

    expect(cpu.SP).toBe(0x0000); // 0x0001 - 1 = 0x0000
  });

  test("0x3B: DEC SP (wrap around)", () => {
    const cpu = createCPUWithROM([0x3b]); // DEC SP
    cpu.SP = 0x0000;

    cpu.tick();

    expect(cpu.SP).toBe(0xffff); // 0x0000 - 1 = 0xFFFF (wrap around)
  });

  // Edge cases and combinations
  test("0xE8: ADD SP,r8 (negative immediate, no carries)", () => {
    const cpu = createCPUWithROM([0xe8, 0xff]); // ADD SP,-1 (0xFF = -1 in signed 8-bit)
    cpu.SP = 0x1200;

    cpu.tick();

    expect(cpu.SP).toBe(0x11ff); // 0x1200 + (-1) = 0x11FF
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear (0x0 + 0xF = 0xF, no carry from bit 3)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (0x00 + 0xFF = 0xFF, no carry from bit 7)
  });

  test("0x23: INC HL (preserves flags)", () => {
    const cpu = createCPUWithROM([0x23]); // INC HL
    cpu.HL = 0x1234;
    cpu.F = 0x50; // Set some flags (Z=0, N=1, H=0, C=1)

    cpu.tick();

    expect(cpu.HL).toBe(0x1235); // 0x1234 + 1 = 0x1235
    expect(cpu.F).toBe(0x50); // Flags completely unchanged
  });

  test("0x2B: DEC HL (preserves flags)", () => {
    const cpu = createCPUWithROM([0x2b]); // DEC HL
    cpu.HL = 0x1234;
    cpu.F = 0xa0; // Set some flags (Z=1, N=0, H=1, C=0)

    cpu.tick();

    expect(cpu.HL).toBe(0x1233); // 0x1234 - 1 = 0x1233
    expect(cpu.F).toBe(0xa0); // Flags completely unchanged
  });

  // Test cases for Game Boy CB SWAP operations (CB 30-37)

  test("CB 30: SWAP B", () => {
    const cpu = createCPUWithROM([0xcb, 0x30]); // SWAP B
    cpu.B = 0x12;

    cpu.tick();

    expect(cpu.B).toBe(0x21); // Swap 0x12 -> 0x21 (upper/lower nibbles swapped)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (result != 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear (always clear for SWAP)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (always clear for SWAP)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (always clear for SWAP)
  });

  test("CB 30: SWAP B (zero result)", () => {
    const cpu = createCPUWithROM([0xcb, 0x30]); // SWAP B
    cpu.B = 0x00;

    cpu.tick();

    expect(cpu.B).toBe(0x00); // Swap 0x00 -> 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 31: SWAP C", () => {
    const cpu = createCPUWithROM([0xcb, 0x31]); // SWAP C
    cpu.C = 0xab;

    cpu.tick();

    expect(cpu.C).toBe(0xba); // Swap 0xAB -> 0xBA
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 32: SWAP D", () => {
    const cpu = createCPUWithROM([0xcb, 0x32]); // SWAP D
    cpu.D = 0xf0;

    cpu.tick();

    expect(cpu.D).toBe(0x0f); // Swap 0xF0 -> 0x0F
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 33: SWAP E", () => {
    const cpu = createCPUWithROM([0xcb, 0x33]); // SWAP E
    cpu.E = 0x05;

    cpu.tick();

    expect(cpu.E).toBe(0x50); // Swap 0x05 -> 0x50
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 34: SWAP H", () => {
    const cpu = createCPUWithROM([0xcb, 0x34]); // SWAP H
    cpu.H = 0x9c;

    cpu.tick();

    expect(cpu.H).toBe(0xc9); // Swap 0x9C -> 0xC9
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 35: SWAP L", () => {
    const cpu = createCPUWithROM([0xcb, 0x35]); // SWAP L
    cpu.L = 0x3d;

    cpu.tick();

    expect(cpu.L).toBe(0xd3); // Swap 0x3D -> 0xD3
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 36: SWAP (HL)", () => {
    const cpu = createCPUWithROM([0xcb, 0x36]); // SWAP (HL)
    cpu.HL = 0xc000;
    (cpu as any)._memory.writeByte(0xc000, 0x87);

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xc000)).toBe(0x78); // Swap 0x87 -> 0x78
    expect(cpu.HL).toBe(0xc000); // HL unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 36: SWAP (HL) (zero result)", () => {
    const cpu = createCPUWithROM([0xcb, 0x36]); // SWAP (HL)
    cpu.HL = 0xc000;
    (cpu as any)._memory.writeByte(0xc000, 0x00);

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xc000)).toBe(0x00); // Swap 0x00 -> 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 37: SWAP A", () => {
    const cpu = createCPUWithROM([0xcb, 0x37]); // SWAP A
    cpu.A = 0x4e;

    cpu.tick();

    expect(cpu.A).toBe(0xe4); // Swap 0x4E -> 0xE4
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 37: SWAP A (zero result)", () => {
    const cpu = createCPUWithROM([0xcb, 0x37]); // SWAP A
    cpu.A = 0x00;

    cpu.tick();

    expect(cpu.A).toBe(0x00); // Swap 0x00 -> 0x00
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result == 0)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 30: SWAP B (symmetric nibbles)", () => {
    const cpu = createCPUWithROM([0xcb, 0x30]); // SWAP B
    cpu.B = 0x77;

    cpu.tick();

    expect(cpu.B).toBe(0x77); // Swap 0x77 -> 0x77 (same result since nibbles are identical)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 31: SWAP C (single nibble)", () => {
    const cpu = createCPUWithROM([0xcb, 0x31]); // SWAP C
    cpu.C = 0x0a;

    cpu.tick();

    expect(cpu.C).toBe(0xa0); // Swap 0x0A -> 0xA0
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 32: SWAP D (other single nibble)", () => {
    const cpu = createCPUWithROM([0xcb, 0x32]); // SWAP D
    cpu.D = 0xb0;

    cpu.tick();

    expect(cpu.D).toBe(0x0b); // Swap 0xB0 -> 0x0B
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 36: SWAP (HL) (complex address)", () => {
    const cpu = createCPUWithROM([0xcb, 0x36]); // SWAP (HL)
    cpu.HL = 0xff80;
    (cpu as any)._memory.writeByte(0xff80, 0x1f);

    cpu.tick();

    expect((cpu as any)._memory.readByte(0xff80)).toBe(0xf1); // Swap 0x1F -> 0xF1
    expect(cpu.HL).toBe(0xff80); // HL unchanged
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("CB 37: SWAP A (flag preservation test)", () => {
    const cpu = createCPUWithROM([0xcb, 0x37]); // SWAP A
    cpu.A = 0x42;
    cpu.F = 0xf0; // Set all flags initially

    cpu.tick();

    expect(cpu.A).toBe(0x24); // Swap 0x42 -> 0x24
    expect(cpu.F & 0x80).toBe(0); // Z flag clear (overwritten by SWAP result)
    expect(cpu.F & 0x40).toBe(0); // N flag clear (always clear for SWAP)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (always clear for SWAP)
    expect(cpu.F & 0x10).toBe(0); // C flag clear (always clear for SWAP)
  });

  // Test cases for Game Boy DAA (Decimal Adjust Accumulator) operation (0x27)

  // Addition cases - when N flag is clear
  test("0x27: DAA after ADD (9 + 1 = 10 in BCD)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x09; // BCD 9
    cpu.B = 0x01; // BCD 1

    cpu.tick(); // Execute ADD B (A = 0x0A, H=0, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x10); // 0x0A adjusted to 0x10 (BCD for decimal 10)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear (preserved from ADD)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (cleared by DAA)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA after ADD (5 + 5 = 10 in BCD)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x05; // BCD 5
    cpu.B = 0x05; // BCD 5

    cpu.tick(); // Execute ADD B (A = 0x0A, H=0, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x10); // 0x0A adjusted to 0x10 (BCD for decimal 10)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA after ADD (19 + 1 = 20 in BCD)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x19; // BCD 19
    cpu.B = 0x01; // BCD 1

    cpu.tick(); // Execute ADD B (A = 0x1A, H=0, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x20); // 0x1A adjusted to 0x20 (BCD for decimal 20)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA after ADD with half carry (9 + 7 = 16 in BCD)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x09; // BCD 9
    cpu.B = 0x07; // BCD 7

    cpu.tick(); // Execute ADD B (A = 0x10, H=1, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x16); // 0x10 adjusted to 0x16 (BCD for decimal 16)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA after ADD with carry (99 + 1 = 100 in BCD)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x99; // BCD 99
    cpu.B = 0x01; // BCD 1

    cpu.tick(); // Execute ADD B (A = 0x9A, H=0, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x00); // 0x9A adjusted to 0x00 (BCD for 100, but only 2 digits fit)
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result is 0x00)
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry out)
  });

  test("0x27: DAA after ADD with both carries (99 + 9 = 108 in BCD)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x99; // BCD 99
    cpu.B = 0x09; // BCD 9

    cpu.tick(); // Execute ADD B (A = 0xA2, H=1, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x08); // 0xA2 adjusted to 0x08 (BCD for 108, but only 2 digits fit)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (carry out)
  });

  // Subtraction cases - when N flag is set
  test("0x27: DAA after SUB (10 - 1 = 9 in BCD)", () => {
    const cpu = createCPUWithROM([0x90, 0x27]); // SUB B, then DAA
    cpu.A = 0x10; // BCD 10
    cpu.B = 0x01; // BCD 1

    cpu.tick(); // Execute SUB B (A = 0x0F, H=1, C=0, N=1)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x09); // 0x0F adjusted to 0x09 (BCD for decimal 9)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set (preserved from SUB)
    expect(cpu.F & 0x20).toBe(0); // H flag clear (cleared by DAA)
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA after SUB (20 - 1 = 19 in BCD)", () => {
    const cpu = createCPUWithROM([0x90, 0x27]); // SUB B, then DAA
    cpu.A = 0x20; // BCD 20
    cpu.B = 0x01; // BCD 1

    cpu.tick(); // Execute SUB B (A = 0x1F, H=1, C=0, N=1)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x19); // 0x1F adjusted to 0x19 (BCD for decimal 19)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA after SUB with borrow (0 - 1 in BCD)", () => {
    const cpu = createCPUWithROM([0x90, 0x27]); // SUB B, then DAA
    cpu.A = 0x00; // BCD 0
    cpu.B = 0x01; // BCD 1

    cpu.tick(); // Execute SUB B (A = 0xFF, H=1, C=1, N=1)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x99); // 0xFF adjusted to 0x99 (BCD for -1, represented as 99)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag set (borrow)
  });

  // Edge cases
  test("0x27: DAA with no adjustment needed (addition)", () => {
    const cpu = createCPUWithROM([0x80, 0x27]); // ADD B, then DAA
    cpu.A = 0x12; // BCD 12
    cpu.B = 0x34; // BCD 34

    cpu.tick(); // Execute ADD B (A = 0x46, H=0, C=0, N=0)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x46); // 0x46 needs no adjustment (valid BCD for 46)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA with no adjustment needed (subtraction)", () => {
    const cpu = createCPUWithROM([0x90, 0x27]); // SUB B, then DAA
    cpu.A = 0x46; // BCD 46
    cpu.B = 0x23; // BCD 23

    cpu.tick(); // Execute SUB B (A = 0x23, H=0, C=0, N=1)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x23); // 0x23 needs no adjustment (valid BCD for 23)
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA resulting in zero", () => {
    const cpu = createCPUWithROM([0x90, 0x27]); // SUB B, then DAA
    cpu.A = 0x50; // BCD 50
    cpu.B = 0x50; // BCD 50

    cpu.tick(); // Execute SUB B (A = 0x00, H=0, C=0, N=1)
    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x00); // 0x00 needs no adjustment
    expect(cpu.F & 0x80).toBe(0x80); // Z flag set (result is zero)
    expect(cpu.F & 0x40).toBe(0x40); // N flag set
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  // Test DAA behavior when called directly (not after arithmetic)
  test("0x27: DAA with invalid BCD in A register", () => {
    const cpu = createCPUWithROM([0x27]); // DAA only
    cpu.A = 0x1a; // Invalid BCD (A > 9 in lower nibble)
    cpu.F = 0x00; // N=0 (addition mode), H=0, C=0

    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x20); // 0x1A adjusted to 0x20
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA with H flag set but valid BCD", () => {
    const cpu = createCPUWithROM([0x27]); // DAA only
    cpu.A = 0x16; // Valid BCD
    cpu.F = 0x20; // N=0, H=1, C=0

    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0x1c); // 0x16 + 0x06 (due to H flag) = 0x1C
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0); // C flag clear
  });

  test("0x27: DAA with C flag set", () => {
    const cpu = createCPUWithROM([0x27]); // DAA only
    cpu.A = 0x46; // Valid BCD
    cpu.F = 0x10; // N=0, H=0, C=1

    cpu.tick(); // Execute DAA

    expect(cpu.A).toBe(0xa6); // 0x46 + 0x60 = 0xA6
    expect(cpu.F & 0x80).toBe(0); // Z flag clear
    expect(cpu.F & 0x40).toBe(0); // N flag clear
    expect(cpu.F & 0x20).toBe(0); // H flag clear
    expect(cpu.F & 0x10).toBe(0x10); // C flag preserved
  });

  describe("0x2F: CPL (Complement A)", () => {
    test("CPL complements all bits in A", () => {
      const cpu = createCPUWithROM([0x2f]); // CPL only
      cpu.A = 0xaa; // 10101010
      cpu.F = 0x00; // Clear all flags

      cpu.tick(); // Execute CPL

      expect(cpu.A).toBe(0x55); // 01010101 (complement of 0xAA)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
      expect(cpu.F & 0x90).toBe(0x00); // Z and C flags unchanged (cleared)
    });

    test("CPL with A = 0x00", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x00; // 00000000
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.A).toBe(0xff); // 11111111 (complement of 0x00)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
    });

    test("CPL with A = 0xFF", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0xff; // 11111111
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.A).toBe(0x00); // 00000000 (complement of 0xFF)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
    });

    test("CPL preserves Z and C flags when they are set", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x0f; // 00001111
      cpu.F = 0x90; // Z and C flags set, N and H clear

      cpu.tick();

      expect(cpu.A).toBe(0xf0); // 11110000 (complement of 0x0F)
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F & 0x10).toBe(0x10); // C flag preserved
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
    });

    test("CPL preserves Z and C flags when they are clear", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x33; // 00110011
      cpu.F = 0x60; // N and H already set, Z and C clear

      cpu.tick();

      expect(cpu.A).toBe(0xcc); // 11001100 (complement of 0x33)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag preserved (clear)
      expect(cpu.F & 0x10).toBe(0x00); // C flag preserved (clear)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags remain set
    });

    test("CPL flag behavior - always sets N and H", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x42;
      cpu.F = 0x00; // All flags clear

      cpu.tick();

      expect(cpu.A).toBe(0xbd); // ~0x42
      expect(cpu.F & 0x40).toBe(0x40); // N flag set
      expect(cpu.F & 0x20).toBe(0x20); // H flag set
    });

    test("CPL with mixed flag states", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x7e; // 01111110
      cpu.F = 0xa0; // Z set, N clear, H set, C clear

      cpu.tick();

      expect(cpu.A).toBe(0x81); // 10000001 (complement of 0x7E)
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F & 0x40).toBe(0x40); // N flag now set
      expect(cpu.F & 0x20).toBe(0x20); // H flag now set
      expect(cpu.F & 0x10).toBe(0x00); // C flag preserved (clear)
      expect(cpu.F).toBe(0xe0); // Final flags: Z=1, N=1, H=1, C=0
    });

    test("CPL timing and PC increment", () => {
      const cpu = createCPUWithROM([0x2f]);
      const initialPC = cpu.PC;
      cpu.A = 0x5a;

      cpu.tick();

      expect(cpu.PC).toBe(initialPC + 1); // PC should increment by 1
      expect(cpu.A).toBe(0xa5); // ~0x5A
      // CPL takes 4 cycles - you might want to test this if you track cycles
    });
  });

  describe("0x2F: CPL (Complement A)", () => {
    test("CPL complements all bits in A", () => {
      const cpu = createCPUWithROM([0x2f]); // CPL only
      cpu.A = 0xaa; // 10101010
      cpu.F = 0x00; // Clear all flags

      cpu.tick(); // Execute CPL

      expect(cpu.A).toBe(0x55); // 01010101 (complement of 0xAA)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
      expect(cpu.F & 0x90).toBe(0x00); // Z and C flags unchanged (cleared)
    });

    test("CPL with A = 0x00", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x00; // 00000000
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.A).toBe(0xff); // 11111111 (complement of 0x00)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
    });

    test("CPL with A = 0xFF", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0xff; // 11111111
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.A).toBe(0x00); // 00000000 (complement of 0xFF)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
    });

    test("CPL preserves Z and C flags when they are set", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x0f; // 00001111
      cpu.F = 0x90; // Z and C flags set, N and H clear

      cpu.tick();

      expect(cpu.A).toBe(0xf0); // 11110000 (complement of 0x0F)
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F & 0x10).toBe(0x10); // C flag preserved
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags set
    });

    test("CPL preserves Z and C flags when they are clear", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x33; // 00110011
      cpu.F = 0x60; // N and H already set, Z and C clear

      cpu.tick();

      expect(cpu.A).toBe(0xcc); // 11001100 (complement of 0x33)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag preserved (clear)
      expect(cpu.F & 0x10).toBe(0x00); // C flag preserved (clear)
      expect(cpu.F & 0x60).toBe(0x60); // N and H flags remain set
    });

    test("CPL flag behavior - always sets N and H", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x42;
      cpu.F = 0x00; // All flags clear

      cpu.tick();

      expect(cpu.A).toBe(0xbd); // ~0x42
      expect(cpu.F & 0x40).toBe(0x40); // N flag set
      expect(cpu.F & 0x20).toBe(0x20); // H flag set
    });

    test("CPL with mixed flag states", () => {
      const cpu = createCPUWithROM([0x2f]);
      cpu.A = 0x7e; // 01111110
      cpu.F = 0xa0; // Z set, N clear, H set, C clear

      cpu.tick();

      expect(cpu.A).toBe(0x81); // 10000001 (complement of 0x7E)
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F & 0x40).toBe(0x40); // N flag now set
      expect(cpu.F & 0x20).toBe(0x20); // H flag now set
      expect(cpu.F & 0x10).toBe(0x00); // C flag preserved (clear)
      expect(cpu.F).toBe(0xe0); // Final flags: Z=1, N=1, H=1, C=0
    });

    test("CPL timing and PC increment", () => {
      const cpu = createCPUWithROM([0x2f]);
      const initialPC = cpu.PC;
      cpu.A = 0x5a;

      cpu.tick();

      expect(cpu.PC).toBe(initialPC + 1); // PC should increment by 1
      expect(cpu.A).toBe(0xa5); // ~0x5A
      // CPL takes 4 cycles - you might want to test this if you track cycles
    });
  });

  describe("0x3F: CCF (Complement Carry Flag)", () => {
    test("CCF complements carry flag from 0 to 1", () => {
      const cpu = createCPUWithROM([0x3f]); // CCF only
      cpu.F = 0x80; // Z=1, N=0, H=0, C=0

      cpu.tick(); // Execute CCF

      expect(cpu.F & 0x10).toBe(0x10); // C flag now set
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F).toBe(0x90); // Final: Z=1, N=0, H=0, C=1
    });

    test("CCF complements carry flag from 1 to 0", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.F = 0xf0; // Z=1, N=1, H=1, C=1 (all flags set)

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x00); // C flag now clear
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F).toBe(0x80); // Final: Z=1, N=0, H=0, C=0
    });

    test("CCF with carry clear and Z flag clear", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.F = 0x60; // Z=0, N=1, H=1, C=0

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x10); // C flag now set
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x00); // Z flag preserved (clear)
      expect(cpu.F).toBe(0x10); // Final: Z=0, N=0, H=0, C=1
    });

    test("CCF with carry set and Z flag clear", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.F = 0x70; // Z=0, N=1, H=1, C=1

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x00); // C flag now clear
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x00); // Z flag preserved (clear)
      expect(cpu.F).toBe(0x00); // Final: Z=0, N=0, H=0, C=0
    });

    test("CCF with all flags initially clear", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.F = 0x00; // All flags clear

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x10); // C flag set
      expect(cpu.F & 0x40).toBe(0x00); // N flag clear
      expect(cpu.F & 0x20).toBe(0x00); // H flag clear
      expect(cpu.F & 0x80).toBe(0x00); // Z flag clear
      expect(cpu.F).toBe(0x10); // Final: Z=0, N=0, H=0, C=1
    });

    test("CCF only affects specific flags", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.F = 0xa0; // Z=1, N=0, H=1, C=0

      cpu.tick();

      expect(cpu.F & 0x80).toBe(0x80); // Z flag unchanged
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x10).toBe(0x10); // C flag complemented (set)
      expect(cpu.F).toBe(0x90); // Final: Z=1, N=0, H=0, C=1
    });

    test("CCF does not affect accumulator", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.A = 0x42;
      cpu.F = 0x10; // C flag set

      cpu.tick();

      expect(cpu.A).toBe(0x42); // A unchanged
      expect(cpu.F & 0x10).toBe(0x00); // C flag complemented (cleared)
    });

    test("CCF timing and PC increment", () => {
      const cpu = createCPUWithROM([0x3f]);
      const initialPC = cpu.PC;
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.PC).toBe(initialPC + 1); // PC should increment by 1
      expect(cpu.F).toBe(0x10); // C flag set, others clear
      // CCF takes 4 cycles - you might want to test this if you track cycles
    });

    test("CCF repeated execution toggles carry", () => {
      const cpu = createCPUWithROM([0x3f, 0x3f]); // Two CCF instructions
      cpu.F = 0x80; // Z=1, others clear

      // First CCF
      cpu.tick();
      expect(cpu.F).toBe(0x90); // Z=1, C=1

      // Second CCF
      cpu.tick();
      expect(cpu.F).toBe(0x80); // Z=1, C=0 (back to original C state)
    });

    test("CCF flag masking - only affects flag register bits", () => {
      const cpu = createCPUWithROM([0x3f]);
      cpu.F = 0xff; // All bits set (including unused bits)

      cpu.tick();

      // Should only affect the 4 flag bits, but this depends on your implementation
      // The Game Boy only uses bits 7,6,5,4 for Z,N,H,C respectively
      expect(cpu.F & 0x10).toBe(0x00); // C complemented (was 1, now 0)
      expect(cpu.F & 0x40).toBe(0x00); // N cleared
      expect(cpu.F & 0x20).toBe(0x00); // H cleared
      expect(cpu.F & 0x80).toBe(0x80); // Z preserved
    });
  });
  describe("0x37: SCF (Set Carry Flag)", () => {
    test("SCF sets carry flag when initially clear", () => {
      const cpu = createCPUWithROM([0x37]); // SCF only
      cpu.F = 0x80; // Z=1, N=0, H=0, C=0

      cpu.tick(); // Execute SCF

      expect(cpu.F & 0x10).toBe(0x10); // C flag now set
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F).toBe(0x90); // Final: Z=1, N=0, H=0, C=1
    });

    test("SCF sets carry flag when already set", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.F = 0xf0; // Z=1, N=1, H=1, C=1 (all flags set)

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x10); // C flag remains set
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x80); // Z flag preserved
      expect(cpu.F).toBe(0x90); // Final: Z=1, N=0, H=0, C=1
    });

    test("SCF with Z flag clear", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.F = 0x60; // Z=0, N=1, H=1, C=0

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x10); // C flag set
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x00); // Z flag preserved (clear)
      expect(cpu.F).toBe(0x10); // Final: Z=0, N=0, H=0, C=1
    });

    test("SCF with all flags initially clear", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.F = 0x00; // All flags clear

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x10); // C flag set
      expect(cpu.F & 0x40).toBe(0x00); // N flag clear
      expect(cpu.F & 0x20).toBe(0x00); // H flag clear
      expect(cpu.F & 0x80).toBe(0x00); // Z flag clear
      expect(cpu.F).toBe(0x10); // Final: Z=0, N=0, H=0, C=1
    });

    test("SCF only affects specific flags", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.F = 0xa0; // Z=1, N=0, H=1, C=0

      cpu.tick();

      expect(cpu.F & 0x80).toBe(0x80); // Z flag unchanged
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x10).toBe(0x10); // C flag set
      expect(cpu.F).toBe(0x90); // Final: Z=1, N=0, H=0, C=1
    });

    test("SCF does not affect accumulator or other registers", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.A = 0x42;
      cpu.B = 0x11;
      cpu.C = 0x22;
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.A).toBe(0x42); // A unchanged
      expect(cpu.B).toBe(0x11); // B unchanged
      expect(cpu.C).toBe(0x22); // C unchanged
      expect(cpu.F).toBe(0x10); // Only flags affected
    });

    test("SCF always produces same flag result regardless of initial N and H", () => {
      const testCases = [
        { initial: 0x00, expected: 0x10 }, // Z=0, N=0, H=0, C=0
        { initial: 0x20, expected: 0x10 }, // Z=0, N=0, H=1, C=0
        { initial: 0x40, expected: 0x10 }, // Z=0, N=1, H=0, C=0
        { initial: 0x60, expected: 0x10 }, // Z=0, N=1, H=1, C=0
        { initial: 0x80, expected: 0x90 }, // Z=1, N=0, H=0, C=0
        { initial: 0xa0, expected: 0x90 }, // Z=1, N=0, H=1, C=0
        { initial: 0xc0, expected: 0x90 }, // Z=1, N=1, H=0, C=0
        { initial: 0xe0, expected: 0x90 }, // Z=1, N=1, H=1, C=0
      ];

      testCases.forEach(({ initial, expected }) => {
        const cpu = createCPUWithROM([0x37]);
        cpu.F = initial;
        cpu.tick();
        expect(cpu.F).toBe(expected);
      });
    });

    test("SCF timing and PC increment", () => {
      const cpu = createCPUWithROM([0x37]);
      const initialPC = cpu.PC;
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.PC).toBe(initialPC + 1); // PC should increment by 1
      expect(cpu.F).toBe(0x10); // C flag set, others clear
      // SCF takes 4 cycles - you might want to test this if you track cycles
    });

    test("SCF is idempotent - multiple executions produce same result", () => {
      const cpu = createCPUWithROM([0x37, 0x37, 0x37]); // Three SCF instructions
      cpu.F = 0x60; // Z=0, N=1, H=1, C=0

      // First SCF
      cpu.tick();
      expect(cpu.F).toBe(0x10); // Z=0, N=0, H=0, C=1

      // Second SCF
      cpu.tick();
      expect(cpu.F).toBe(0x10); // Same result

      // Third SCF
      cpu.tick();
      expect(cpu.F).toBe(0x10); // Same result
    });

    test("SCF with carry already set - N and H still cleared", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.F = 0x70; // Z=0, N=1, H=1, C=1

      cpu.tick();

      expect(cpu.F & 0x10).toBe(0x10); // C flag remains set
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F & 0x80).toBe(0x00); // Z flag preserved (clear)
      expect(cpu.F).toBe(0x10); // Final: Z=0, N=0, H=0, C=1
    });

    test("SCF flag masking - only affects flag register bits", () => {
      const cpu = createCPUWithROM([0x37]);
      cpu.F = 0x8f; // Z=1, with some unused bits potentially set

      cpu.tick();

      // Should only affect the 4 flag bits
      expect(cpu.F & 0x10).toBe(0x10); // C set
      expect(cpu.F & 0x40).toBe(0x00); // N cleared
      expect(cpu.F & 0x20).toBe(0x00); // H cleared
      expect(cpu.F & 0x80).toBe(0x80); // Z preserved
      expect(cpu.F & 0x0f).toBe(0x00); // Lower 4 bits should be 0 (unused in GB)
    });
  });

  describe("0x07: RLCA (Rotate Left Circular A)", () => {
    test("RLCA rotates A left with bit 7 going to carry and bit 0", () => {
      const cpu = createCPUWithROM([0x07]); // RLCA only
      cpu.A = 0x85; // 10000101
      cpu.F = 0x00; // Clear all flags

      cpu.tick(); // Execute RLCA

      expect(cpu.A).toBe(0x0b); // 00001011 (rotated left)
      expect(cpu.F & 0x10).toBe(0x10); // C flag set (bit 7 was 1)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared (RLCA always clears Z)
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
    });

    test("RLCA with bit 7 clear - carry flag cleared", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0x42; // 01000010
      cpu.F = 0xf0; // All flags initially set

      cpu.tick();

      expect(cpu.A).toBe(0x84); // 10000100 (rotated left)
      expect(cpu.F & 0x10).toBe(0x00); // C flag cleared (bit 7 was 0)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
    });

    test("RLCA with A = 0x00", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0x00; // 00000000
      cpu.F = 0x90; // Z and C flags set

      cpu.tick();

      expect(cpu.A).toBe(0x00); // 00000000 (remains zero)
      expect(cpu.F & 0x10).toBe(0x00); // C flag cleared (bit 7 was 0)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared (RLCA always clears Z)
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F).toBe(0x00); // All flags cleared
    });

    test("RLCA with A = 0xFF", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0xff; // 11111111
      cpu.F = 0x00;

      cpu.tick();

      expect(cpu.A).toBe(0xff); // 11111111 (remains same)
      expect(cpu.F & 0x10).toBe(0x10); // C flag set (bit 7 was 1)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F).toBe(0x10); // Only C flag set
    });

    test("RLCA with A = 0x80 (only bit 7 set)", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0x80; // 10000000
      cpu.F = 0x60; // N and H flags set

      cpu.tick();

      expect(cpu.A).toBe(0x01); // 00000001 (bit 7 moved to bit 0)
      expect(cpu.F & 0x10).toBe(0x10); // C flag set (bit 7 was 1)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F).toBe(0x10); // Only C flag set
    });

    test("RLCA with A = 0x01 (only bit 0 set)", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0x01; // 00000001
      cpu.F = 0x10; // C flag initially set

      cpu.tick();

      expect(cpu.A).toBe(0x02); // 00000010 (shifted left)
      expect(cpu.F & 0x10).toBe(0x00); // C flag cleared (bit 7 was 0)
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared
      expect(cpu.F & 0x40).toBe(0x00); // N flag cleared
      expect(cpu.F & 0x20).toBe(0x00); // H flag cleared
      expect(cpu.F).toBe(0x00); // All flags cleared
    });

    test("RLCA always clears Z flag even when result is zero", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0x00;
      cpu.F = 0x80; // Z flag set

      cpu.tick();

      expect(cpu.A).toBe(0x00); // Result is zero
      expect(cpu.F & 0x80).toBe(0x00); // Z flag cleared (important!)
      expect(cpu.F).toBe(0x00); // All flags cleared
    });

    test("RLCA flag behavior - always clears Z, N, H", () => {
      const testCases = [
        { A: 0x55, expectedA: 0xaa, expectedC: 0x00 }, // 01010101 -> 10101010
        { A: 0xaa, expectedA: 0x55, expectedC: 0x10 }, // 10101010 -> 01010101
        { A: 0x7f, expectedA: 0xfe, expectedC: 0x00 }, // 01111111 -> 11111110
        { A: 0xfe, expectedA: 0xfd, expectedC: 0x10 }, // 11111110 -> 11111101
      ];

      testCases.forEach(({ A, expectedA, expectedC }) => {
        const cpu = createCPUWithROM([0x07]);
        cpu.A = A;
        cpu.F = 0xf0; // All flags initially set

        cpu.tick();

        expect(cpu.A).toBe(expectedA);
        expect(cpu.F & 0x10).toBe(expectedC); // C flag based on original bit 7
        expect(cpu.F & 0x80).toBe(0x00); // Z always cleared
        expect(cpu.F & 0x40).toBe(0x00); // N always cleared
        expect(cpu.F & 0x20).toBe(0x00); // H always cleared
      });
    });

    test("RLCA multiple rotations", () => {
      const cpu = createCPUWithROM([0x07, 0x07, 0x07, 0x07]); // Four RLCA instructions
      cpu.A = 0x81; // 10000001
      cpu.F = 0x00;

      // First rotation: 10000001 -> 00000011, C=1
      cpu.tick();
      expect(cpu.A).toBe(0x03);
      expect(cpu.F & 0x10).toBe(0x10);

      // Second rotation: 00000011 -> 00000110, C=0
      cpu.tick();
      expect(cpu.A).toBe(0x06);
      expect(cpu.F & 0x10).toBe(0x00);

      // Third rotation: 00000110 -> 00001100, C=0
      cpu.tick();
      expect(cpu.A).toBe(0x0c);
      expect(cpu.F & 0x10).toBe(0x00);

      // Fourth rotation: 00001100 -> 00011000, C=0
      cpu.tick();
      expect(cpu.A).toBe(0x18);
      expect(cpu.F & 0x10).toBe(0x00);
    });

    test("RLCA eight rotations return to original", () => {
      const cpu = createCPUWithROM([
        0x07, 0x07, 0x07, 0x07, 0x07, 0x07, 0x07, 0x07,
      ]);
      const originalA = 0x93;
      cpu.A = originalA;
      cpu.F = 0x00;

      // Execute 8 rotations (full circle)
      for (let i = 0; i < 8; i++) {
        cpu.tick();
      }

      expect(cpu.A).toBe(originalA); // Should return to original value
    });

    test("RLCA timing and PC increment", () => {
      const cpu = createCPUWithROM([0x07]);
      const initialPC = cpu.PC;
      cpu.A = 0x42;

      cpu.tick();

      expect(cpu.PC).toBe(initialPC + 1); // PC should increment by 1
      expect(cpu.A).toBe(0x84); // Rotated result
      // RLCA takes 4 cycles - you might want to test this if you track cycles
    });

    test("RLCA does not affect other registers", () => {
      const cpu = createCPUWithROM([0x07]);
      cpu.A = 0x55;
      cpu.B = 0x11;
      cpu.C = 0x22;
      cpu.D = 0x33;
      cpu.E = 0x44;
      cpu.H = 0x55;
      cpu.L = 0x66;

      cpu.tick();

      expect(cpu.A).toBe(0xaa); // Only A should change
      expect(cpu.B).toBe(0x11); // Other registers unchanged
      expect(cpu.C).toBe(0x22);
      expect(cpu.D).toBe(0x33);
      expect(cpu.E).toBe(0x44);
      expect(cpu.H).toBe(0x55);
      expect(cpu.L).toBe(0x66);
    });
  });

  test("0x17: RLA (Rotate A left through carry)", () => {
    const cpu = createCPUWithROM([0x17]); // RLA
    cpu.A = 0b10000000;
    cpu.C_FLAG = false;

    cpu.tick();

    expect(cpu.A).toBe(0b00000000);
    expect(cpu.C_FLAG).toBe(true);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("0x0F: RRCA (Rotate A right)", () => {
    const cpu = createCPUWithROM([0x0f]); // RRCA
    cpu.A = 0b00000001;

    cpu.tick();

    expect(cpu.A).toBe(0b10000000);
    expect(cpu.C_FLAG).toBe(true);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("0x1F: RRA (Rotate A right through carry)", () => {
    const cpu = createCPUWithROM([0x1f]); // RRA
    cpu.A = 0b00000010;
    cpu.C_FLAG = true;

    cpu.tick();

    expect(cpu.A).toBe(0b10000001);
    expect(cpu.C_FLAG).toBe(false);
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("0xCB00: RLC B (Rotate B left)", () => {
    const cpu = createCPUWithROM([0xcb, 0x00]); // RLC B
    cpu.B = 0b10000000;

    cpu.tick();

    expect(cpu.B).toBe(0b00000001);
    expect(cpu.C_FLAG).toBe(true);
    expect(cpu.Z_FLAG).toBe(false);
  });

  test("0xCB10: RL B (Rotate B left through carry)", () => {
    const cpu = createCPUWithROM([0xcb, 0x10]); // RL B
    cpu.B = 0b01000000;
    cpu.C_FLAG = true;

    cpu.tick();

    expect(cpu.B).toBe(0b10000001);
    expect(cpu.C_FLAG).toBe(false);
  });

  test("0xCB08: RRC B (Rotate B right)", () => {
    const cpu = createCPUWithROM([0xcb, 0x08]); // RRC B
    cpu.B = 0b00000001;

    cpu.tick();

    expect(cpu.B).toBe(0b10000000);
    expect(cpu.C_FLAG).toBe(true);
  });

  test("0xCB18: RR B (Rotate B right through carry)", () => {
    const cpu = createCPUWithROM([0xcb, 0x18]); // RR B
    cpu.B = 0b00000010;
    cpu.C_FLAG = true;

    cpu.tick();

    expect(cpu.B).toBe(0b10000001);
    expect(cpu.C_FLAG).toBe(false);
  });

  test("0xCB20: SLA B (Shift Left Arithmetic)", () => {
    const cpu = createCPUWithROM([0xcb, 0x20]); // SLA B
    cpu.B = 0b10000001;

    cpu.tick();

    expect(cpu.B).toBe(0b00000010);
    expect(cpu.C_FLAG).toBe(true); // MSB was 1
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("0xCB28: SRA B (Shift Right Arithmetic)", () => {
    const cpu = createCPUWithROM([0xcb, 0x28]); // SRA B
    cpu.B = 0b10000001;

    cpu.tick();

    expect(cpu.B).toBe(0b11000000); // MSB preserved
    expect(cpu.C_FLAG).toBe(true); // LSB was 1
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("0xCB38: SRL B (Shift Right Logical)", () => {
    const cpu = createCPUWithROM([0xcb, 0x38]); // SRL B
    cpu.B = 0b10000001;

    cpu.tick();

    expect(cpu.B).toBe(0b01000000); // MSB becomes 0
    expect(cpu.C_FLAG).toBe(true); // LSB was 1
    expect(cpu.Z_FLAG).toBe(false);
    expect(cpu.N_FLAG).toBe(false);
    expect(cpu.H_FLAG).toBe(false);
  });

  test("0xCB38: SRL B results in zero", () => {
    const cpu = createCPUWithROM([0xcb, 0x38]); // SRL B
    cpu.B = 0b00000001;

    cpu.tick();

    expect(cpu.B).toBe(0b00000000);
    expect(cpu.Z_FLAG).toBe(true);
    expect(cpu.C_FLAG).toBe(true); // LSB was 1
  });

  describe("CB Prefix: BIT/SET/RES on B", () => {
    for (let bit = 0; bit < 8; bit++) {
      const bitMask = 1 << bit;
      const bitOpcode = 0x40 | (bit << 3); // BIT b, B
      const setOpcode = 0xc0 | (bit << 3); // SET b, B
      const resOpcode = 0x80 | (bit << 3); // RES b, B

      test(`0xCB${bitOpcode.toString(16)}: BIT ${bit}, B (bit is 0)`, () => {
        const cpu = createCPUWithROM([0xcb, bitOpcode]);
        cpu.B = 0x00; // all bits 0

        cpu.tick();

        expect(cpu.Z_FLAG).toBe(true);
        expect(cpu.N_FLAG).toBe(false);
        expect(cpu.H_FLAG).toBe(true);
      });

      test(`0xCB${bitOpcode.toString(16)}: BIT ${bit}, B (bit is 1)`, () => {
        const cpu = createCPUWithROM([0xcb, bitOpcode]);
        cpu.B = bitMask;

        cpu.tick();

        expect(cpu.Z_FLAG).toBe(false);
        expect(cpu.N_FLAG).toBe(false);
        expect(cpu.H_FLAG).toBe(true);
      });

      test(`0xCB${setOpcode.toString(16)}: SET ${bit}, B`, () => {
        const cpu = createCPUWithROM([0xcb, setOpcode]);
        cpu.B = 0x00;

        cpu.tick();

        expect(cpu.B & bitMask).not.toBe(0); // bit was set
      });

      test(`0xCB${resOpcode.toString(16)}: RES ${bit}, B`, () => {
        const cpu = createCPUWithROM([0xcb, resOpcode]);
        cpu.B = 0xff;

        cpu.tick();

        expect(cpu.B & bitMask).toBe(0); // bit was reset
      });
    }
  });
  test("0xC3: JP nn", () => {
    const cpu = createCPUWithROM([0xc3, 0x34, 0x12]); // JP 0x1234
    cpu.tick();
    expect(cpu.PC).toBe(0x1234);
  });

  test("0xC2: JP NZ,nn - taken", () => {
    const cpu = createCPUWithROM([0xc2, 0x34, 0x12]);
    cpu.Z_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x1234);
  });

  test("0xC2: JP NZ,nn - not taken", () => {
    const cpu = createCPUWithROM([0xc2, 0x34, 0x12]);
    cpu.Z_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x0003);
  });

  test("0xCA: JP Z,nn - taken", () => {
    const cpu = createCPUWithROM([0xca, 0x34, 0x12]);
    cpu.Z_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x1234);
  });

  test("0xCA: JP Z,nn - not taken", () => {
    const cpu = createCPUWithROM([0xca, 0x34, 0x12]);
    cpu.Z_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x0003);
  });

  test("0xD2: JP NC,nn - taken", () => {
    const cpu = createCPUWithROM([0xd2, 0x34, 0x12]);
    cpu.C_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x1234);
  });

  test("0xD2: JP NC,nn - not taken", () => {
    const cpu = createCPUWithROM([0xd2, 0x34, 0x12]);
    cpu.C_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x0003);
  });

  test("0xDA: JP C,nn - taken", () => {
    const cpu = createCPUWithROM([0xda, 0x34, 0x12]);
    cpu.C_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x1234);
  });

  test("0xDA: JP C,nn - not taken", () => {
    const cpu = createCPUWithROM([0xda, 0x34, 0x12]);
    cpu.C_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x0003);
  });

  test("0xE9: JP HL", () => {
    const cpu = createCPUWithROM([0xe9]);
    cpu.HL = 0x1234;
    cpu.tick();
    expect(cpu.PC).toBe(0x1234);
  });

  test("0x18: JR n (forward)", () => {
    const cpu = createCPUWithROM([0x18, 0x05]); // JR +5
    cpu.tick();
    expect(cpu.PC).toBe(0x0002 + 0x05);
  });

  test("0x18: JR n (backward)", () => {
    const cpu = createCPUWithROM([0x18, 0xfb]); // JR -5
    cpu.tick();
    expect(cpu.PC).toBe((0x0002 - 5) & 0xffff);
  });

  test("0x20: JR NZ,n - taken", () => {
    const cpu = createCPUWithROM([0x20, 0x05]); // JR NZ, +5
    cpu.Z_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002 + 0x05);
  });

  test("0x20: JR NZ,n - not taken", () => {
    const cpu = createCPUWithROM([0x20, 0x05]);
    cpu.Z_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002);
  });

  test("0x28: JR Z,n - taken", () => {
    const cpu = createCPUWithROM([0x28, 0x05]);
    cpu.Z_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002 + 0x05);
  });

  test("0x28: JR Z,n - not taken", () => {
    const cpu = createCPUWithROM([0x28, 0x05]);
    cpu.Z_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002);
  });

  test("0x30: JR NC,n - taken", () => {
    const cpu = createCPUWithROM([0x30, 0x05]);
    cpu.C_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002 + 0x05);
  });

  test("0x30: JR NC,n - not taken", () => {
    const cpu = createCPUWithROM([0x30, 0x05]);
    cpu.C_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002);
  });

  test("0x38: JR C,n - taken", () => {
    const cpu = createCPUWithROM([0x38, 0x05]);
    cpu.C_FLAG = true;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002 + 0x05);
  });

  test("0x38: JR C,n - not taken", () => {
    const cpu = createCPUWithROM([0x38, 0x05]);
    cpu.C_FLAG = false;
    cpu.tick();
    expect(cpu.PC).toBe(0x0002);
  });
});
