import { BOOT_ROM_PATH } from "./constants.ts";
import { CPU } from "./cpu.ts";
import { Memory } from "./memory.ts";
import { loadROM } from "./rom.ts";

const main = async () => {
  const bootRom = await loadROM(BOOT_ROM_PATH);
  const memory = new Memory(bootRom);
  const cpu = new CPU(memory);

  while (true) cpu.tick();
};

main().catch(console.error);
