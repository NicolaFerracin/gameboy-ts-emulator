import { BOOT_ROM_PATH } from "./constants.ts";
import { CPU } from "./cpu.ts";
import { Memory } from "./memory.ts";
import { PPU } from "./ppu.ts";
import { loadROM } from "./rom.ts";

const main = async () => {
  const bootRom = await loadROM(BOOT_ROM_PATH);
  const memory = new Memory(bootRom);
  const ppu = new PPU(memory);
  const cpu = new CPU(memory, ppu);

  while (true) cpu.tick();
};

main().catch(console.error);
