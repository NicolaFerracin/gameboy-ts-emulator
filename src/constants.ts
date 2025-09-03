export const BOOT_ROM_PATH = "./roms/dmg_boot.bin";

export const INTERRUPT_ENABLE_ADDR = 0xffff;
export const INTERRUPT_FLAG_ADDR = 0xff0f;

export const HBLANK_MODE = 0 as const;
export const VBLANK_MODE = 1 as const;
export const OAM_MODE = 2 as const;
export const TRANSFER_MODE = 3 as const;
export const ALL_MODES = [HBLANK_MODE, VBLANK_MODE, OAM_MODE, TRANSFER_MODE];
