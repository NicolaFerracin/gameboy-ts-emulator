import { BOOT_ROM_PATH } from "./constants.ts";
import { CPU } from "./cpu.ts";
import { Memory } from "./memory.ts";
import { PPU } from "./ppu.ts";
import { Renderer } from "./renderer.ts";
import { loadROM } from "./rom.ts";
import { GBScreen } from "./screen.ts";

const main = async () => {
  const canvas = document.getElementById("screen");
  const screen = new GBScreen(canvas as HTMLCanvasElement);
  const bootRom = await loadROM(BOOT_ROM_PATH);
  const ppu = new PPU();
  const memory = new Memory(bootRom, ppu);
  const renderer = new Renderer(memory, ppu, screen);
  const cpu = new CPU(memory, ppu);

  for (let i = 0; i < 100000; i++) {
    renderer.renderScanline(i % 144);
  }

  // while (true) cpu.tick();
};

main().catch(console.error);
