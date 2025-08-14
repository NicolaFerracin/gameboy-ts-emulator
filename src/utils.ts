import { u16, u4, u8 } from "./types";

// Apply any mask to a value
export const applyMask = (value: number, mask: number): number => value & mask;
// Ensures an 8bit register gets the proper 8bit value
export const u8Mask = (value: number): u8 => applyMask(value, 0xff);
// Ensures a 16bit register gets the proper 16bit value
export const u16Mask = (value: number): u16 => applyMask(value, 0xffff);
// Applies the 8bit half-carry mask to check for carry from the 3rd to the 4th bit
export const u8HalfCarryMask = (value: u8): u8 => applyMask(value, 0x0f);
// Applies the 16bit half-carry mask to check for carry from the 11th to the 12th bit
export const u16HalfCarryMask = (value: u16): u16 => applyMask(value, 0x0fff);

export const applySign = (value: number): number => (value << 24) >> 24;

// Combines the values of 2 8bit registers into a 16bit value
export const u8Pair = (low: u8, high: u8): u16 => (high << 8) | low;
// Breaks a 16bit value into 2 8bit values
export const u16Unpair = (value: u16): [u8, u8] => [
  u8Mask(value), // low
  u8Mask(value >> 8), // high
];

// Combines the values of 2 4bit values into an 8bit value
export const u4Pair = (low: u4, high: u4): u8 => (high << 4) | low;
// Breaks an 8bit value into 2 4bit values
export const u8Unpair = (value: u8): [u4, u4] => [
  applyMask(value, 0x0f), // low
  applyMask(value >> 4, 0x0f), // high
];

export const numToHex = (str: number): string =>
  str.toString(16).padStart(2, "0");

// Turns an 8bit number to its binary representation
export const u8ToBin = (dec: number): string =>
  (dec >>> 0).toString(2).padStart(8, "0");
// Turns a 16bit number to its binary representation
export const u16ToBin = (dec: number): string =>
  (dec >>> 0).toString(2).padStart(16, "0");

// Returns the value (1|0) of the nth bit of the provided number
export const getBitAtPos = (value: number, pos: number): number =>
  (value >> pos) & 0x01;
// Sets the bit the at given position
export const setBitAtPos = (
  value: number,
  pos: number,
  bit: number
): number => {
  const mask = Math.pow(2, pos);
  return bit === 1 ? value | mask : value & ~mask;
};
