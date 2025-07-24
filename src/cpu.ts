import type { Memory } from "./memory";
import { u16, u8 } from "./types";
import {
  applyMask,
  numToHex,
  u16Mask,
  u16Unpair,
  u8Mask,
  u8Pair,
} from "./utils.ts";

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
  private _memory: Memory;

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

  constructor(memory: Memory) {
    this._memory = memory;
  }

  tick() {
    // Read byte from memory
    const opcode = this._memory.readByte(this.PC);

    // Increase PC
    this.PC++;

    // Execute OPCODE
    this.executeOpcode(opcode);
  }

  executeOpcode(opcode: u8) {
    console.log("Opcode", numToHex(opcode));

    switch (opcode) {
      case 0x00:
        // NOP
        break;

      case 0x01:
      case 0x02:
      case 0x03:
      case 0x04:
      case 0x05:

      case 0x06:
        // LD B, d8
        this._B = this._memory.readByte(this.PC++);
        break;

      case 0x07:
      case 0x08:
      case 0x09:
      case 0x0a:
      case 0x0b:
      case 0x0c:
      case 0x0d:

      case 0x0e:
        // LD C, d8
        this._C = this._memory.readByte(this.PC++);
        break;

      case 0x0f:
      case 0x10:
      case 0x11:
      case 0x12:
      case 0x13:
      case 0x14:
      case 0x15:

      case 0x16:
        // LD D, d8
        this._D = this._memory.readByte(this.PC++);
        break;

      case 0x17:
      case 0x18:
      case 0x19:
      case 0x1a:
      case 0x1b:
      case 0x1c:
      case 0x1d:

      case 0x1e:
        // LD E, d8
        this._E = this._memory.readByte(this.PC++);
        break;

      case 0x1f:
      case 0x20:
      case 0x21:
      case 0x22:
      case 0x23:
      case 0x24:
      case 0x25:

      case 0x26:
        // LD H, d8
        this._H = this._memory.readByte(this.PC++);
        break;

      case 0x27:
      case 0x28:
      case 0x29:
      case 0x2a:
      case 0x2b:
      case 0x2c:
      case 0x2d:

      case 0x2e:
        // LD L, d8
        this._L = this._memory.readByte(this.PC++);
        break;

      case 0x2f:
      case 0x30:
      case 0x31:
      case 0x32:
      case 0x33:
      case 0x34:
      case 0x35:
      case 0x36:
      case 0x37:
      case 0x38:
      case 0x39:
      case 0x3a:
      case 0x3b:
      case 0x3c:
      case 0x3d:

      case 0x3e:
        // LD A, d8
        this._A = this._memory.readByte(this.PC++);
        break;

      case 0x3f:
      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43:
      case 0x44:
      case 0x45:
      case 0x46:
      case 0x47:
      case 0x48:
      case 0x49:
      case 0x4a:
      case 0x4b:
      case 0x4c:
      case 0x4d:
      case 0x4e:
      case 0x4f:
      case 0x50:
      case 0x51:
      case 0x52:
      case 0x53:
      case 0x54:
      case 0x55:
      case 0x56:
      case 0x57:
      case 0x58:
      case 0x59:
      case 0x5a:
      case 0x5b:
      case 0x5c:
      case 0x5d:
      case 0x5e:
      case 0x5f:
      case 0x60:
      case 0x61:
      case 0x62:
      case 0x63:
      case 0x64:
      case 0x65:
      case 0x66:
      case 0x67:
      case 0x68:
      case 0x69:
      case 0x6a:
      case 0x6b:
      case 0x6c:
      case 0x6d:
      case 0x6e:
      case 0x6f:
      case 0x70:
      case 0x71:
      case 0x72:
      case 0x73:
      case 0x74:
      case 0x75:
      case 0x76:
      case 0x77:
      case 0x78:
      case 0x79:
      case 0x7a:
      case 0x7b:
      case 0x7c:
      case 0x7d:
      case 0x7e:
      case 0x7f:
      case 0x80:
      case 0x81:
      case 0x82:
      case 0x83:
      case 0x84:
      case 0x85:
      case 0x86:
      case 0x87:
      case 0x88:
      case 0x89:
      case 0x8a:
      case 0x8b:
      case 0x8c:
      case 0x8d:
      case 0x8e:
      case 0x8f:
      case 0x90:
      case 0x91:
      case 0x92:
      case 0x93:
      case 0x94:
      case 0x95:
      case 0x96:
      case 0x97:
      case 0x98:
      case 0x99:
      case 0x9a:
      case 0x9b:
      case 0x9c:
      case 0x9d:
      case 0x9e:
      case 0x9f:
      case 0xa0:
      case 0xa1:
      case 0xa2:
      case 0xa3:
      case 0xa4:
      case 0xa5:
      case 0xa6:
      case 0xa7:
      case 0xa8:
      case 0xa9:
      case 0xaa:
      case 0xab:
      case 0xac:
      case 0xad:
      case 0xae:
      case 0xaf:
      case 0xb0:
      case 0xb1:
      case 0xb2:
      case 0xb3:
      case 0xb4:
      case 0xb5:
      case 0xb6:
      case 0xb7:
      case 0xb8:
      case 0xb9:
      case 0xba:
      case 0xbb:
      case 0xbc:
      case 0xbd:
      case 0xbe:
      case 0xbf:
      case 0xc0:
      case 0xc1:
      case 0xc2:
      case 0xc3:
      case 0xc4:
      case 0xc5:
      case 0xc6:
      case 0xc7:
      case 0xc8:
      case 0xc9:
      case 0xca:
      case 0xcb:
      case 0xcc:
      case 0xcd:
      case 0xce:
      case 0xcf:
      case 0xd0:
      case 0xd1:
      case 0xd2:
      case 0xd3:
      case 0xd4:
      case 0xd5:
      case 0xd6:
      case 0xd7:
      case 0xd8:
      case 0xd9:
      case 0xda:
      case 0xdb:
      case 0xdc:
      case 0xdd:
      case 0xde:
      case 0xdf:
      case 0xe0:
      case 0xe1:
      case 0xe2:
      case 0xe3:
      case 0xe4:
      case 0xe5:
      case 0xe6:
      case 0xe7:
      case 0xe8:
      case 0xe9:
      case 0xea:
      case 0xeb:
      case 0xec:
      case 0xed:
      case 0xee:
      case 0xef:
      case 0xf0:
      case 0xf1:
      case 0xf2:
      case 0xf3:
      case 0xf4:
      case 0xf5:
      case 0xf6:
      case 0xf7:
      case 0xf8:
      case 0xf9:
      case 0xfa:
      case 0xfb:
      case 0xfc:
      case 0xfd:
      case 0xfe:
      case 0xff:

      default:
        throw new Error("Unknown opcode 0x");
    }
  }
}
