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
    this._F = applyMask(value, 0xf0);
  }

  // F is the flags register. Its low nibble (0-3 bits) is always 0. Its high nibble is a set of 4 flags (ZNHC)
  // Instead of managing F as a whole, we are going to handle the 4 flags individually and they in turn will update F
  get Z_FLAG(): boolean {
    return (this.F & (1 << 7)) !== 0;
  }
  set Z_FLAG(value: boolean) {
    if (value) this.F |= 1 << 7;
    else this.F &= ~(1 << 7);
  }
  get N_FLAG(): boolean {
    return (this.F & (1 << 6)) !== 0;
  }
  set N_FLAG(value: boolean) {
    if (value) this.F |= 1 << 6;
    else this.F &= ~(1 << 6);
  }
  get H_FLAG(): boolean {
    return (this.F & (1 << 5)) !== 0;
  }
  set H_FLAG(value: boolean) {
    if (value) this.F |= 1 << 5;
    else this.F &= ~(1 << 5);
  }
  get C_FLAG(): boolean {
    return (this.F & (1 << 4)) !== 0;
  }
  set C_FLAG(value: boolean) {
    if (value) this.F |= 1 << 4;
    else this.F &= ~(1 << 4);
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
    this._A = u8Mask(high);
    this._F = applyMask(low, 0xf0);
  }

  get BC(): u16 {
    return u8Pair(this._B, this._C);
  }
  set BC(value: number) {
    const [high, low] = u16Unpair(value);
    this._B = u8Mask(high);
    this._C = u8Mask(low);
  }

  get DE(): u16 {
    return u8Pair(this._D, this._E);
  }
  set DE(value: number) {
    const [high, low] = u16Unpair(value);
    this._D = u8Mask(high);
    this._E = u8Mask(low);
  }

  get HL(): u16 {
    return u8Pair(this._H, this._L);
  }
  set HL(value: number) {
    const [high, low] = u16Unpair(value);
    this._H = u8Mask(high);
    this._L = u8Mask(low);
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
        // INC B
        // checks half-carry by checking if the the lower nibble (0-to-3 - resulting from the 0x0f masking)
        // plus 1 overflows (meaning it carries to the bit at position 4 - the 5th bit)
        this.H_FLAG = lowNibbleMask(this.B++) + 1 > 0x0f;
        this.Z_FLAG = this.B === 0;
        this.N_FLAG = false;
        break;

      case 0x05:
        // DEC B
        this.H_FLAG = lowNibbleMask(this.B--) === 0x00;
        this.Z_FLAG = this.B === 0;
        this.N_FLAG = true;
        break;

      case 0x06:
        // LD B, d8
        this.B = this._memory.readByte(this.PC++);
        break;

      case 0x07:
      case 0x08:
      case 0x09:
      case 0x0a:
        // LD A, (BC)
        this.A = this._memory.readByte(this.BC);
        break;

      case 0x0b:
      case 0x0c:
        // INC C
        this.H_FLAG = lowNibbleMask(this.C++) + 1 > 0x0f;
        this.Z_FLAG = this.C === 0;
        this.N_FLAG = false;
        break;

      case 0x0d:
        // DEC C
        this.H_FLAG = lowNibbleMask(this.C--) === 0x00;
        this.Z_FLAG = this.C === 0;
        this.N_FLAG = true;
        break;

      case 0x0e:
        // LD C, d8
        this.C = this._memory.readByte(this.PC++);
        break;

      case 0x0f:
      case 0x10:
      case 0x11:
      case 0x12:
      case 0x13:
      case 0x14:
        // INC D
        this.H_FLAG = lowNibbleMask(this.D++) + 1 > 0x0f;
        this.Z_FLAG = this.D === 0;
        this.N_FLAG = false;
        break;

      case 0x15:
        // DEC D
        this.H_FLAG = lowNibbleMask(this.D--) === 0x00;
        this.Z_FLAG = this.D === 0;
        this.N_FLAG = true;
        break;

      case 0x16:
        // LD D, d8
        this.D = this._memory.readByte(this.PC++);
        break;

      case 0x17:
      case 0x18:
      case 0x19:
      case 0x1a:
        // LD A, (DE)
        this.A = this._memory.readByte(this.DE);
        break;

      case 0x1b:
      case 0x1c:
        // INC E
        this.H_FLAG = lowNibbleMask(this.E++) + 1 > 0x0f;
        this.Z_FLAG = this.E === 0;
        this.N_FLAG = false;
        break;

      case 0x1d:
        // DEC E
        this.H_FLAG = lowNibbleMask(this.E--) === 0x00;
        this.Z_FLAG = this.E === 0;
        this.N_FLAG = true;
        break;

      case 0x1e:
        // LD E, d8
        this.E = this._memory.readByte(this.PC++);
        break;

      case 0x1f:
      case 0x20:
      case 0x21:
      case 0x22:
        // LD (HL+), A
        this._memory.writeByte(this.HL++, this.A);
        break;

      case 0x23:
      case 0x24:
        // INC H
        this.H_FLAG = lowNibbleMask(this.H++) + 1 > 0x0f;
        this.Z_FLAG = this.H === 0;
        this.N_FLAG = false;
        break;

      case 0x25:
        // DEC H
        this.H_FLAG = lowNibbleMask(this.H--) === 0x00;
        this.Z_FLAG = this.H === 0;
        this.N_FLAG = true;
        break;

      case 0x26:
        // LD H, d8
        this.H = this._memory.readByte(this.PC++);
        break;

      case 0x27:
      case 0x28:
      case 0x29:
      case 0x2a:
        // LD A, (HL+)
        this.A = this._memory.readByte(this.HL++);
        break;

      case 0x2b:
      case 0x2c:
        // INC L
        this.H_FLAG = lowNibbleMask(this.L++) + 1 > 0x0f;
        this.Z_FLAG = this.L === 0;
        this.N_FLAG = false;
        break;

      case 0x2d:
        // DEC L
        this.H_FLAG = lowNibbleMask(this.L--) === 0x00;
        this.Z_FLAG = this.L === 0;
        this.N_FLAG = true;
        break;

      case 0x2e:
        // LD L, d8
        this.L = this._memory.readByte(this.PC++);
        break;

      case 0x2f:
      case 0x30:
      case 0x31:
      case 0x32:
        // LD (HL-), A
        this._memory.writeByte(this.HL--, this.A);
        break;

      case 0x33:
      case 0x34:
      case 0x35:
      case 0x36:
        // LD (HL), d8
        const value = this._memory.readByte(this.PC++);
        this._memory.writeByte(this.HL, value);
        break;

      case 0x37:
      case 0x38:
      case 0x39:
      case 0x3a:
        // LD A, (HL-)
        this.A = this._memory.readByte(this.HL--);
        break;

      case 0x3b:
      case 0x3c:
        // INC A
        this.H_FLAG = lowNibbleMask(this.A++) + 1 > 0x0f;
        this.Z_FLAG = this.A === 0;
        this.N_FLAG = false;
        break;

      case 0x3d:
        // DEC A
        this.H_FLAG = lowNibbleMask(this.A--) === 0x00;
        this.Z_FLAG = this.A === 0;
        this.N_FLAG = true;
        break;

      case 0x3e:
        // LD A, d8
        this.A = this._memory.readByte(this.PC++);
        break;

      case 0x3f:
      case 0x40:
        // LD B, B
        // Effectively a NOP
        break;

      case 0x41:
        // LD B, C
        this.B = this.C;
        break;

      case 0x42:
        // LD B, D
        this.B = this.D;
        break;

      case 0x43:
        // LD B, E
        this.B = this.E;
        break;

      case 0x44:
        // LD B, H
        this.B = this.H;
        break;

      case 0x45:
        // LD B, L
        this.B = this.L;
        break;

      case 0x46:
        // LD B, (HL)
        this.B = this._memory.readByte(this.HL);
        break;

      case 0x47:
        // LD B, A
        this.B = this.A;
        break;

      case 0x48:
        // LD C, B
        this.C = this.B;
        break;

      case 0x49:
        // LD C, C
        // Effectively a NOP
        break;

      case 0x4a:
        // LD C, D
        this.C = this.D;
        break;

      case 0x4b:
        // LD C, E
        this.C = this.E;
        break;

      case 0x4c:
        // LD C, H
        this.C = this.H;
        break;

      case 0x4d:
        // LD C, L
        this.C = this.L;
        break;

      case 0x4e:
        // LD C, (HL)
        this.C = this._memory.readByte(this.HL);
        break;

      case 0x4f:
        // LD C, A
        this.C = this.A;
        break;

      case 0x50:
        // LD D, B
        this.D = this.B;
        break;

      case 0x51:
        // LD D, C
        this.D = this.C;
        break;

      case 0x52:
        // LD D, D
        // Effectively a NOP
        break;

      case 0x53:
        // LD D, E
        this.D = this.E;
        break;

      case 0x54:
        // LD D, H
        this.D = this.H;
        break;

      case 0x55:
        // LD D, L
        this.D = this.L;
        break;

      case 0x56:
        // LD D, (HL)
        this.D = this._memory.readByte(this.HL);
        break;

      case 0x57:
        // LD D, A
        this.D = this.A;
        break;

      case 0x58:
        // LD E, B
        this.E = this.B;
        break;

      case 0x59:
        // LD E, C
        this.E = this.C;
        break;

      case 0x5a:
        // LD E, D
        this.E = this.D;
        break;

      case 0x5b:
        // LD E, E
        // Effectively a NOP
        break;

      case 0x5c:
        // LD E, H
        this.E = this.H;
        break;

      case 0x5d:
        // LD E, L
        this.E = this.L;
        break;

      case 0x5e:
        // LD E, (HL)
        this.E = this._memory.readByte(this.HL);
        break;

      case 0x5f:
        // LD E, A
        this.E = this.A;
        break;

      case 0x60:
        // LD H, B
        this.H = this.B;
        break;

      case 0x61:
        // LD H, C
        this.H = this.C;
        break;

      case 0x62:
        // LD H, D
        this.H = this.D;
        break;

      case 0x63:
        // LD H, E
        this.H = this.E;
        break;

      case 0x64:
        // LD H, H
        // Effectively a NOP
        break;

      case 0x65:
        // LD H, L
        this.H = this.L;
        break;

      case 0x66:
        // LD H, (HL)
        this.H = this._memory.readByte(this.HL);
        break;

      case 0x67:
        // LD H, A
        this.H = this.A;
        break;

      case 0x68:
        // LD L, B
        this.L = this.B;
        break;

      case 0x69:
        // LD L, C
        this.L = this.C;
        break;

      case 0x6a:
        // LD L, D
        this.L = this.D;
        break;

      case 0x6b:
        // LD L, E
        this.L = this.E;
        break;

      case 0x6c:
        // LD L, H
        this.L = this.H;
        break;

      case 0x6d:
        // LD L, L
        // Effectively a NOP
        break;

      case 0x6e:
        // LD L, (HL)
        this.L = this._memory.readByte(this.HL);
        break;

      case 0x6f:
        // LD L, A
        this.L = this.A;
        break;

      case 0x70:
        // LD (HL), B
        this._memory.writeByte(this.HL, this.B);
        break;

      case 0x71:
        // LD (HL), C
        this._memory.writeByte(this.HL, this.C);
        break;

      case 0x72:
        // LD (HL), D
        this._memory.writeByte(this.HL, this.D);
        break;

      case 0x73:
        // LD (HL), E
        this._memory.writeByte(this.HL, this.E);
        break;

      case 0x74:
        // LD (HL), H
        this._memory.writeByte(this.HL, this.H);
        break;

      case 0x75:
        // LD (HL), L
        this._memory.writeByte(this.HL, this.L);
        break;

      case 0x76:
      case 0x77:
        // LD (HL), A
        this._memory.writeByte(this.HL, this.A);
        break;

      case 0x78:
        // LD A, B
        this.A = this.B;
        break;

      case 0x79:
        // LD A, C
        this.A = this.C;
        break;

      case 0x7a:
        // LD A, D
        this.A = this.D;
        break;

      case 0x7b:
        // LD A, E
        this.A = this.E;
        break;

      case 0x7c:
        // LD A, H
        this.A = this.H;
        break;

      case 0x7d:
        // LD A, L
        this.A = this.L;
        break;

      case 0x7e:
        // LD A, (HL)
        this.A = this._memory.readByte(this.HL);
        break;

      case 0x7f:
        // LD A, A
        // Effectively a NOP
        break;

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
        // LD (a8), A
        this._memory.writeByte(
          this._memory.readByte(this.PC++) + 0xff00,
          this.A
        );
        break;

      case 0xe1:
      case 0xe2:
        // LD (C), A
        this._memory.writeByte(0xff00 + this.C, this.A);
        break;

      case 0xe3:
      case 0xe4:
      case 0xe5:
      case 0xe6:
      case 0xe7:
      case 0xe8:
      case 0xe9:
      case 0xea:
        // LD(a16), A;
        const ld_a16_addr = combineU8(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        this._memory.writeByte(ld_a16_addr, this.A);
        break;

      case 0xeb:
      case 0xec:
      case 0xed:
      case 0xee:
      case 0xef:
      case 0xf0:
        // LD A, (a8)
        const ld_a_a8 = this._memory.readByte(this.PC++);
        this.A = this._memory.readByte(0xff00 + ld_a_a8);
        break;

      case 0xf1:
      case 0xf2:
        // LD A, (C)
        this.A = this._memory.readByte(0xff00 + this.C);
        break;

      case 0xf3:
      case 0xf4:
      case 0xf5:
      case 0xf6:
      case 0xf7:
      case 0xf8:
      case 0xf9:
      case 0xfa:
        // LD A, (a16)
        const ld_a_addr = combineU8(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        this.A = this._memory.readByte(ld_a_addr);
        break;

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
