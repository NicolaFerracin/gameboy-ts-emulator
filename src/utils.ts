import { u16, u8 } from "./types";

// Apply any mask to a value
export const applyMask = (value: number, mask: number): number => value & mask;
// Ensures an 8bit register gets the proper 8bit value
export const u8Mask = (value: number): u8 => applyMask(value, 0xff);
// Ensures a 16bit register gets the proper 16bit value
export const u16Mask = (value: number): u16 => applyMask(value, 0xffff);

// Combines the values of 2 8bit registers into a 16bit value
export const u8Pair = (high: u8, low: u8): u16 => (high << 8) | low;
// Breaks a 16bit value into 2 8bit values
export const u16Unpair = (value: u16): [u8, u8] => [
  u8Mask(value >> 8),
  u8Mask(value),
];
