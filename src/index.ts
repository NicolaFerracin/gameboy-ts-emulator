import { BOOT_ROM_PATH } from "./constants.ts";
import { CPU } from "./cpu.ts";
import { Memory } from "./memory.ts";
import { PPU } from "./ppu.ts";
import { Renderer } from "./renderer.ts";
import { loadROM } from "./rom.ts";
import { GBScreen } from "./screen.ts";

const DOTS_PER_FRAME = 456 * 154; // 70_224
const MCYCLES_PER_FRAME = DOTS_PER_FRAME / 4; // 17_556

const run = async () => {
  const canvas = document.getElementById("screen");
  const screen = new GBScreen(canvas as HTMLCanvasElement);
  const bootRom = await loadROM(BOOT_ROM_PATH);
  const gameRom = await loadROM(import.meta.env.VITE_GAME_ROM);
  const ppu = new PPU();
  const memory = new Memory(bootRom, gameRom, ppu);
  const renderer = new Renderer(memory, ppu, screen);
  const cpu = new CPU(memory, ppu);

  function runOneFrame() {
    let remaining = MCYCLES_PER_FRAME;
    while (remaining > 0) {
      remaining -= cpu.tick();
    }

    if (ppu.frameReady) {
      screen.present(renderer.buf); // blit once per frame
      ppu.frameReady = false;
    }
    requestAnimationFrame(runOneFrame);
  }
  requestAnimationFrame(runOneFrame);
};

run();
