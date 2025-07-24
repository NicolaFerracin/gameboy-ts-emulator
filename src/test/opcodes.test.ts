import { CPU } from "../cpu";
import { Memory } from "../memory";

describe("CPU-Memory Integration", () => {
  let cpu: CPU;
  let memory: Memory;

  beforeEach(() => {
    // Minimal ROM: 0x3E 0x42 = LD A, 0x42; 0x00 = NOP; 0x00 = NOP;
    const rom = new Uint8Array([0x3e, 0x42, 0x00, 0x00]);
    memory = new Memory(rom);
    cpu = new CPU(memory);
  });

  test("Executes LD A, 0x42 followed by NOPs", () => {
    expect(cpu.A).toBe(0x00); // initial

    cpu.tick(); // LD A, 0x42
    expect(cpu.A).toBe(0x42);
    expect(cpu.PC).toBe(2); // moved past opcode and operand

    cpu.tick(); // NOP
    expect(cpu.PC).toBe(3);

    cpu.tick(); // NOP
    expect(cpu.PC).toBe(4);
  });
});
