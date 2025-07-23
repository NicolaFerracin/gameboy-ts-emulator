import { u16, u8 } from "./types";
import { u8Mask, u8Pair, u16Unpair, u16Mask, applyMask } from "./utils";

export class CPU {
  private _A: u8 = 0;
  private _B: u8 = 0;
  private _C: u8 = 0;
  private _D: u8 = 0;
  private _E: u8 = 0;
  private _F: u8 = 0;
  private _H: u8 = 0;
  private _L: u8 = 0;
  private _PC: u16 = 0;
  private _SP: u16 = 0;
  private _IR: u16 = 0;
  private _IE: u16 = 0;

  get A(): u8 {
    return this._A;
  }
  set A(value: number) {
    this._A = u8Mask(value);
  }

  get B(): u8 {
    return this._B;
  }
  set B(value: number) {
    this._B = u8Mask(value);
  }

  get C(): u8 {
    return this._C;
  }
  set C(value: number) {
    this._C = u8Mask(value);
  }

  get D(): u8 {
    return this._D;
  }
  set D(value: number) {
    this._D = u8Mask(value);
  }

  get E(): u8 {
    return this._E;
  }
  set E(value: number) {
    this._E = u8Mask(value);
  }

  get F(): u8 {
    return this._F;
  }
  set F(value: number) {
    this._F = applyMask(value, 0xf0); // F lower 4 bits are always 0
  }

  get H(): u8 {
    return this._H;
  }
  set H(value: number) {
    this._H = u8Mask(value);
  }

  get L(): u8 {
    return this._L;
  }
  set L(value: number) {
    this._L = u8Mask(value);
  }

  get AF(): u16 {
    return u8Pair(this._A, this._F);
  }
  set AF(value: number) {
    const [high, low] = u16Unpair(value);
    this._A = high;
    this._F = low;
  }

  get BC(): u16 {
    return u8Pair(this._B, this._C);
  }
  set BC(value: number) {
    const [high, low] = u16Unpair(value);
    this._B = high;
    this._C = low;
  }

  get DE(): u16 {
    return u8Pair(this._D, this._E);
  }
  set DE(value: number) {
    const [high, low] = u16Unpair(value);
    this._D = high;
    this._E = low;
  }

  get HL(): u16 {
    return u8Pair(this._H, this._L);
  }
  set HL(value: number) {
    const [high, low] = u16Unpair(value);
    this._H = high;
    this._L = low;
  }

  get PC(): u16 {
    return this._PC;
  }
  set PC(value: number) {
    this._PC = u16Mask(value);
  }

  get SP(): u16 {
    return this._SP;
  }
  set SP(value: number) {
    this._SP = u16Mask(value);
  }
}
