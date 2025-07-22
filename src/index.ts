import { loadROM } from "./rom.ts";

const main = async () => {
  const romPath = process.argv[2];
  const rom = await loadROM(romPath);
};

main().catch(console.error);
