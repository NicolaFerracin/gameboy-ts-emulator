import { u16, u8 } from "./types";

// Apply any mask to a value
export const applyMask = (value: number, mask: number): number => value & mask;
// Ensures an 8bit register gets the proper 8bit value
export const u8Mask = (value: number): u8 => applyMask(value, 0xff);
// Ensures a 16bit register gets the proper 16bit value
export const u16Mask = (value: number): u16 => applyMask(value, 0xffff);
// Applies the lower nibble mask (00001111) to a value
export const lowNibbleMask = (value: u8): u8 => applyMask(value, 0x0f);
// Applies the high byte mask (1111111100000000) to a value
export const highByteMask = (value: u16): u16 => applyMask(value, 0xff00);
// Applies the low byte mask (0000000011111111) to a value
export const lowByteMask = (value: u16): u16 => applyMask(value, 0x00ff);

export const applySign = (value: number): number => (value << 24) >> 24;

// Combines the values of 2 8bit registers into a 16bit value
export const u8Pair = (low: u8, high: u8): u16 => (high << 8) | low;
// Breaks a 16bit value into 2 8bit values
export const u16Unpair = (value: u16): [u8, u8] => [
  u8Mask(value), // low
  u8Mask(value >> 8), // high
];

export const numToHex = (str: number): string =>
  str.toString(16).padStart(2, "0");
