import { CPU } from "./cpu.ts";
import { Memory } from "./memory.ts";
import { loadROM } from "./rom.ts";

const main = async () => {
  const romPath = process.argv[2];
  const rom = await loadROM(romPath);

  const memory = new Memory(rom);
  const cpu = new CPU(memory);

  for (let i = 0; i < 10; i++) {
    cpu.tick();
  }
};

main().catch(console.error);
