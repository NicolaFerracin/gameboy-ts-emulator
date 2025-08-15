import type { Memory } from "./memory";
import { u16, u8 } from "./types";
import {
  applyMask,
  applySign,
  getBitAtPos,
  numToHex,
  setBitAtPos,
  u16HalfCarryMask,
  u16Mask,
  u16Unpair,
  u4Pair,
  u8HalfCarryMask,
  u8Mask,
  u8Pair,
  u8Unpair,
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
  private isHalted: boolean; // Stops the System Clock
  private isStopped: boolean; // Stops both the System Clock and Oscillator Circuit

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
    return u8Pair(this._F, this._A);
  }
  set AF(value: number) {
    const [low, high] = u16Unpair(value);
    this._A = u8Mask(high);
    this._F = applyMask(low, 0xf0);
  }

  get BC(): u16 {
    return u8Pair(this._C, this._B);
  }
  set BC(value: number) {
    const [low, high] = u16Unpair(value);
    this._B = u8Mask(high);
    this._C = u8Mask(low);
  }

  get DE(): u16 {
    return u8Pair(this._E, this._D);
  }
  set DE(value: number) {
    const [low, high] = u16Unpair(value);
    this._D = u8Mask(high);
    this._E = u8Mask(low);
  }

  get HL(): u16 {
    return u8Pair(this._L, this._H);
  }
  set HL(value: number) {
    const [low, high] = u16Unpair(value);
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
    this.isHalted = false;
    this.isStopped = false;
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
        // LD BC, d16
        this.BC = u8Pair(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        break;

      case 0x02:
      case 0x03:
        // INC BC
        this.BC++;
        break;

      case 0x04:
        // INC B
        // checks half-carry by checking if the the lower nibble (0-to-3 - resulting from the 0x0f masking)
        // plus 1 overflows (meaning it carries to the bit at position 4 - the 5th bit)
        this.H_FLAG = u8HalfCarryMask(this.B++) + 1 > 0x0f;
        this.Z_FLAG = this.B === 0;
        this.N_FLAG = false;
        break;

      case 0x05:
        // DEC B
        this.H_FLAG = u8HalfCarryMask(this.B--) === 0x00;
        this.Z_FLAG = this.B === 0;
        this.N_FLAG = true;
        break;

      case 0x06:
        // LD B, d8
        this.B = this._memory.readByte(this.PC++);
        break;

      case 0x07:
        // RLCA
        this.A = this._executeRotateLeft(this.A, false);
        break;

      case 0x08:
        // LD (a16), SP
        const ld_a6_addr = this._memory.readByte(this.PC++);
        const [ld_a6_low, ld_a6_high] = u16Unpair(this.SP);
        this._memory.writeByte(ld_a6_addr, ld_a6_low);
        this._memory.writeByte(u8Mask(ld_a6_addr + 1), ld_a6_high);
        break;

      case 0x09:
        // ADD HL, BC
        this._u16ExecuteAdd(this.BC);
        break;

      case 0x0a:
        // LD A, (BC)
        this.A = this._memory.readByte(this.BC);
        break;

      case 0x0b:
        // DEC BC
        this.BC--;
        break;

      case 0x0c:
        // INC C
        this.H_FLAG = u8HalfCarryMask(this.C++) + 1 > 0x0f;
        this.Z_FLAG = this.C === 0;
        this.N_FLAG = false;
        break;

      case 0x0d:
        // DEC C
        this.H_FLAG = u8HalfCarryMask(this.C--) === 0x00;
        this.Z_FLAG = this.C === 0;
        this.N_FLAG = true;
        break;

      case 0x0e:
        // LD C, d8
        this.C = this._memory.readByte(this.PC++);
        break;

      case 0x0f:
        // RRCA
        this.A = this._executeRotateRight(this.A, false);
        break;

      case 0x10:
        // STOP
        this.isStopped = true;
        break;

      case 0x11:
        // LD DE, d16
        this.DE = u8Pair(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        break;

      case 0x12:
      case 0x13:
        // INC DE
        this.DE++;
        break;

      case 0x14:
        // INC D
        this.H_FLAG = u8HalfCarryMask(this.D++) + 1 > 0x0f;
        this.Z_FLAG = this.D === 0;
        this.N_FLAG = false;
        break;

      case 0x15:
        // DEC D
        this.H_FLAG = u8HalfCarryMask(this.D--) === 0x00;
        this.Z_FLAG = this.D === 0;
        this.N_FLAG = true;
        break;

      case 0x16:
        // LD D, d8
        this.D = this._memory.readByte(this.PC++);
        break;

      case 0x17:
        // RLA
        this.A = this._executeRotateLeftThroughCarry(this.A, false);
        break;

      case 0x18:
      case 0x19:
        // ADD HL, DE
        this._u16ExecuteAdd(this.DE);
        break;

      case 0x1a:
        // LD A, (DE)
        this.A = this._memory.readByte(this.DE);
        break;

      case 0x1b:
        // DEC DE
        this.DE--;
        break;

      case 0x1c:
        // INC E
        this.H_FLAG = u8HalfCarryMask(this.E++) + 1 > 0x0f;
        this.Z_FLAG = this.E === 0;
        this.N_FLAG = false;
        break;

      case 0x1d:
        // DEC E
        this.H_FLAG = u8HalfCarryMask(this.E--) === 0x00;
        this.Z_FLAG = this.E === 0;
        this.N_FLAG = true;
        break;

      case 0x1e:
        // LD E, d8
        this.E = this._memory.readByte(this.PC++);
        break;

      case 0x1f:
        // RRA
        this.A = this._executeRotateRightThroughCarry(this.A, false);
        break;

      case 0x20:
      case 0x21:
        // LD HL, d16
        this.HL = u8Pair(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        break;

      case 0x22:
        // LD (HL+), A
        this._memory.writeByte(this.HL++, this.A);
        break;

      case 0x23:
        // INC HL
        this.HL++;
        break;

      case 0x24:
        // INC H
        this.H_FLAG = u8HalfCarryMask(this.H++) + 1 > 0x0f;
        this.Z_FLAG = this.H === 0;
        this.N_FLAG = false;
        break;

      case 0x25:
        // DEC H
        this.H_FLAG = u8HalfCarryMask(this.H--) === 0x00;
        this.Z_FLAG = this.H === 0;
        this.N_FLAG = true;
        break;

      case 0x26:
        // LD H, d8
        this.H = this._memory.readByte(this.PC++);
        break;

      case 0x27:
        // DAA
        // always called after an addition or a subtraction.
        // We use the F flags that were set in the previous operation to decide what to do
        // This opcode turns the A reg into a Binary-Coded Decimal:
        // 0x11 -> 0x11 => stays the same
        // 0x1a -> 0x26 => 'a' is not valid, and we need to wrap around and turn it into a decimal. While doing that we have a carry on the 1
        // 0xa1 -> 0x161 => same as above, 'a' becomes 6 and we have a carry to the higher bit

        // if we there was an addition then the N flag was not set...
        if (!this.N_FLAG) {
          // ...if A is above 0x99 or there was a carry...
          if (this.A > 0x99 || this.C_FLAG) {
            // ...we wrap A around
            this.A += 0x60;
            // ...we set the carry flag
            this.C_FLAG = true;
          }
          // ...if the low nibble is greater than 0x09 orthere was an half-carry...
          if (u8HalfCarryMask(this.A) > 0x09 || this.H_FLAG) {
            // ...we wrap the low nibble of A around
            this.A += 0x06;
            // ...we don't set the half-carry flag, because it's always cleared at the end
          }
        }
        // else (there was a subtraction)...
        else {
          // ...with additions, you get into the 0xaa/0xff range by:
          // - doing a carry (0x80 + 0x80 => 0x100)
          // - or by simply adding values (0x09 + 0x01 => 0x0a)
          // it's fairly easy to visualize as you keep adding from 0 to a, you don't necessarily incur in a carry to get into the 0xa/0xf range
          // BUT with subtraction, the only way to get into the range is by having a carry or half-carry
          // in fact you go from 5 -> 4 -> 3 -> 2 -> 1 -> 0 -> f ====> you get to the 0xa/0xf range only with a carry or half-carry
          if (this.C_FLAG) this.A -= 0x60;
          if (this.H_FLAG) this.A -= 0x06;
        }

        this.Z_FLAG = this.A === 0;
        this.H_FLAG = false;
        break;
      case 0x28:
      case 0x29:
        // ADD HL, HL
        this._u16ExecuteAdd(this.HL);
        break;

      case 0x2a:
        // LD A, (HL+)
        this.A = this._memory.readByte(this.HL++);
        break;

      case 0x2b:
        // DEC HL
        this.HL--;
        break;

      case 0x2c:
        // INC L
        this.H_FLAG = u8HalfCarryMask(this.L++) + 1 > 0x0f;
        this.Z_FLAG = this.L === 0;
        this.N_FLAG = false;
        break;

      case 0x2d:
        // DEC L
        this.H_FLAG = u8HalfCarryMask(this.L--) === 0x00;
        this.Z_FLAG = this.L === 0;
        this.N_FLAG = true;
        break;

      case 0x2e:
        // LD L, d8
        this.L = this._memory.readByte(this.PC++);
        break;

      case 0x2f:
        // CPL
        this.A = ~this.A;
        this.N_FLAG = true;
        this.H_FLAG = true;
        break;

      case 0x30:
      case 0x31:
        // LD SP, d16
        this.SP = u8Pair(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        break;

      case 0x32:
        // LD (HL-), A
        this._memory.writeByte(this.HL--, this.A);
        break;

      case 0x33:
        // INC SP
        this.SP++;
        break;

      case 0x34:
      case 0x35:
      case 0x36:
        // LD (HL), d8
        const value = this._memory.readByte(this.PC++);
        this._memory.writeByte(this.HL, value);
        break;

      case 0x37:
        // SCF
        this.C_FLAG = true;
        this.N_FLAG = false;
        this.H_FLAG = false;
        break;

      case 0x38:
      case 0x39:
        // ADD HL, SP
        this._u16ExecuteAdd(this.SP);
        break;

      case 0x3a:
        // LD A, (HL-)
        this.A = this._memory.readByte(this.HL--);
        break;

      case 0x3b:
        // DEC SP
        this.SP--;
        break;

      case 0x3c:
        // INC A
        this.H_FLAG = u8HalfCarryMask(this.A++) + 1 > 0x0f;
        this.Z_FLAG = this.A === 0;
        this.N_FLAG = false;
        break;

      case 0x3d:
        // DEC A
        this.H_FLAG = u8HalfCarryMask(this.A--) === 0x00;
        this.Z_FLAG = this.A === 0;
        this.N_FLAG = true;
        break;

      case 0x3e:
        // LD A, d8
        this.A = this._memory.readByte(this.PC++);
        break;

      case 0x3f:
        // CCF
        this.C_FLAG = !this.C_FLAG;
        this.N_FLAG = false;
        this.H_FLAG = false;
        break;

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
        // HALT
        this.isHalted = true;
        break;

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
        // ADD A, B
        this._u8ExecuteAdd(this.B);
        break;

      case 0x81:
        // ADD A, C
        this._u8ExecuteAdd(this.C);
        break;

      case 0x82:
        // ADD A, D
        this._u8ExecuteAdd(this.D);
        break;

      case 0x83:
        // ADD A, E
        this._u8ExecuteAdd(this.E);
        break;

      case 0x84:
        // ADD A, H
        this._u8ExecuteAdd(this.H);
        break;

      case 0x85:
        // ADD A, L
        this._u8ExecuteAdd(this.L);
        break;

      case 0x86:
        // ADD A, (HL)
        this._u8ExecuteAdd(this._memory.readByte(this.HL));
        break;

      case 0x87:
        // ADD A, A
        this._u8ExecuteAdd(this.A);
        break;

      case 0x88:
        // ADC A, B
        this._u8ExecuteAdd(this.B, +this.C_FLAG);
        break;

      case 0x89:
        // ADC A, C
        this._u8ExecuteAdd(this.C, +this.C_FLAG);
        break;

      case 0x8a:
        // ADC A, D
        this._u8ExecuteAdd(this.D, +this.C_FLAG);
        break;

      case 0x8b:
        // ADC A, E
        this._u8ExecuteAdd(this.E, +this.C_FLAG);
        break;

      case 0x8c:
        // ADC A, H
        this._u8ExecuteAdd(this.H, +this.C_FLAG);
        break;

      case 0x8d:
        // ADC A, L
        this._u8ExecuteAdd(this.L, +this.C_FLAG);
        break;

      case 0x8e:
        // ADC A, (HL)
        this._u8ExecuteAdd(this._memory.readByte(this.HL), +this.C_FLAG);
        break;

      case 0x8f:
        // ADC A, A
        this._u8ExecuteAdd(this.A, +this.C_FLAG);
        break;

      case 0x90:
        // SUB B
        this._u8ExecuteSub(this.B);
        break;

      case 0x91:
        // SUB C
        this._u8ExecuteSub(this.C);
        break;

      case 0x92:
        // SUB D
        this._u8ExecuteSub(this.D);
        break;

      case 0x93:
        // SUB E
        this._u8ExecuteSub(this.E);
        break;

      case 0x94:
        // SUB H
        this._u8ExecuteSub(this.H);
        break;

      case 0x95:
        // SUB L
        this._u8ExecuteSub(this.L);
        break;

      case 0x96:
        // SUB (HL)
        this._u8ExecuteSub(this._memory.readByte(this.HL));
        break;

      case 0x97:
        // SUB A
        this._u8ExecuteSub(this.A);
        break;

      case 0x98:
        // SBC A, B
        this._u8ExecuteSub(this.B, +this.C_FLAG);
        break;

      case 0x99:
        // SBC A, C
        this._u8ExecuteSub(this.C, +this.C_FLAG);
        break;

      case 0x9a:
        // SBC A, D
        this._u8ExecuteSub(this.D, +this.C_FLAG);
        break;

      case 0x9b:
        // SBC A, E
        this._u8ExecuteSub(this.E, +this.C_FLAG);
        break;

      case 0x9c:
        // SBC A, H
        this._u8ExecuteSub(this.H, +this.C_FLAG);
        break;

      case 0x9d:
        // SBC A, L
        this._u8ExecuteSub(this.L, +this.C_FLAG);
        break;

      case 0x9e:
        // SBC A, (HL)
        this._u8ExecuteSub(this._memory.readByte(this.HL), +this.C_FLAG);
        break;

      case 0x9f:
        // SBC A, A
        this._u8ExecuteSub(this.A, +this.C_FLAG);
        break;

      case 0xa0:
        // AND B
        this._u8ExecuteAnd(this.B);
        break;

      case 0xa1:
        // AND C
        this._u8ExecuteAnd(this.C);
        break;

      case 0xa2:
        // AND D
        this._u8ExecuteAnd(this.D);
        break;

      case 0xa3:
        // AND E
        this._u8ExecuteAnd(this.E);
        break;

      case 0xa4:
        // AND H
        this._u8ExecuteAnd(this.H);
        break;

      case 0xa5:
        // AND L
        this._u8ExecuteAnd(this.L);
        break;

      case 0xa6:
        // AND (HL)
        this._u8ExecuteAnd(this._memory.readByte(this.HL));
        break;

      case 0xa7:
        // AND A
        this._u8ExecuteAnd(this.A);
        break;

      case 0xa8:
        // XOR B
        this._u8ExecuteXor(this.B);
        break;

      case 0xa9:
        // XOR C
        this._u8ExecuteXor(this.C);
        break;

      case 0xaa:
        // XOR D
        this._u8ExecuteXor(this.D);
        break;

      case 0xab:
        // XOR E
        this._u8ExecuteXor(this.E);
        break;

      case 0xac:
        // XOR H
        this._u8ExecuteXor(this.H);
        break;

      case 0xad:
        // XOR L
        this._u8ExecuteXor(this.L);
        break;

      case 0xae:
        // XOR (HL)
        this._u8ExecuteXor(this._memory.readByte(this.HL));
        break;

      case 0xaf:
        // XOR A
        this._u8ExecuteXor(this.A);
        break;

      case 0xb0:
        // OR B
        this._u8ExecuteOr(this.B);
        break;

      case 0xb1:
        // OR C
        this._u8ExecuteOr(this.C);
        break;

      case 0xb2:
        // OR D
        this._u8ExecuteOr(this.D);
        break;

      case 0xb3:
        // OR E
        this._u8ExecuteOr(this.E);
        break;

      case 0xb4:
        // OR H
        this._u8ExecuteOr(this.H);
        break;

      case 0xb5:
        // OR L
        this._u8ExecuteOr(this.L);
        break;

      case 0xb6:
        // OR (HL)
        this._u8ExecuteOr(this._memory.readByte(this.HL));
        break;

      case 0xb7:
        // OR A
        this._u8ExecuteOr(this.A);
        break;

      case 0xb8:
        // CP B
        this._u8ExecuteCp(this.B);
        break;

      case 0xb9:
        // CP C
        this._u8ExecuteCp(this.C);
        break;

      case 0xba:
        // CP D
        this._u8ExecuteCp(this.D);
        break;

      case 0xbb:
        // CP E
        this._u8ExecuteCp(this.E);
        break;

      case 0xbc:
        // CP H
        this._u8ExecuteCp(this.H);
        break;

      case 0xbd:
        // CP L
        this._u8ExecuteCp(this.L);
        break;

      case 0xbe:
        // CP (HL)
        this._u8ExecuteCp(this._memory.readByte(this.HL));
        break;

      case 0xbf:
        // CP A
        this._u8ExecuteCp(this.A);
        break;

      case 0xc0:
      case 0xc1:
        // POP BC
        this.BC = u8Pair(
          this._memory.readByte(this.SP++),
          this._memory.readByte(this.SP++)
        );
        break;

      case 0xc2:
      case 0xc3:
      case 0xc4:
      case 0xc5:
        // PUSH BC
        const [push_bc_low, push_bc_high] = u16Unpair(this.BC);
        this._memory.writeByte(--this.SP, push_bc_high);
        this._memory.writeByte(--this.SP, push_bc_low);
        break;

      case 0xc6:
        // ADD A, d8
        this._u8ExecuteAdd(this._memory.readByte(this.PC++));
        break;

      case 0xc7:
      case 0xc8:
      case 0xc9:
      case 0xca:
      case 0xcb:
        this.executeCbOpcode(this._memory.readByte(this.PC++));
        break;

      case 0xcc:
      case 0xcd:
      case 0xce:
        // ADC A, d8
        this._u8ExecuteAdd(this._memory.readByte(this.PC++), +this.C_FLAG);
        break;

      case 0xcf:
      case 0xd0:
      case 0xd1:
        // POP DE
        this.DE = u8Pair(
          this._memory.readByte(this.SP++),
          this._memory.readByte(this.SP++)
        );
        break;

      case 0xd2:
      case 0xd3:
      case 0xd4:
      case 0xd5:
        // PUSH DE
        const [push_de_low, push_de_high] = u16Unpair(this.DE);
        this._memory.writeByte(--this.SP, push_de_high);
        this._memory.writeByte(--this.SP, push_de_low);
        break;

      case 0xd6:
        // SUB d8
        this._u8ExecuteSub(this._memory.readByte(this.PC++));
        break;

      case 0xd7:
      case 0xd8:
      case 0xd9:
      case 0xda:
      case 0xdb:
      case 0xdc:
      case 0xdd:
      case 0xde:
        // SBC A, d8
        this._u8ExecuteSub(this._memory.readByte(this.PC++), +this.C_FLAG);
        break;

      case 0xdf:
      case 0xe0:
        // LD (a8), A
        this._memory.writeByte(
          this._memory.readByte(this.PC++) + 0xff00,
          this.A
        );
        break;

      case 0xe1:
        // POP HL
        this.HL = u8Pair(
          this._memory.readByte(this.SP++),
          this._memory.readByte(this.SP++)
        );
        break;

      case 0xe2:
        // LD (C), A
        this._memory.writeByte(0xff00 + this.C, this.A);
        break;

      case 0xe3:
      case 0xe4:
      case 0xe5:
        // PUSH HL
        const [push_hl_low, push_hl_high] = u16Unpair(this.HL);
        this._memory.writeByte(--this.SP, push_hl_high);
        this._memory.writeByte(--this.SP, push_hl_low);
        break;

      case 0xe6:
        // AND d8
        this._u8ExecuteAnd(this._memory.readByte(this.PC++));
        break;

      case 0xe7:
      case 0xe8:
        // ADD SP, s8
        const add_sp_s8 = this._memory.readByte(this.PC++);
        this.H_FLAG =
          u8HalfCarryMask(this.SP) + u8HalfCarryMask(add_sp_s8) > 0x0f;
        this.C_FLAG = u8Mask(this.SP) + add_sp_s8 > 0xff;
        // s8 is supposed to be signed
        this.SP += applySign(add_sp_s8);
        this.Z_FLAG = false;
        this.N_FLAG = false;
        break;

      case 0xe9:
      case 0xea:
        // LD(a16), A;
        const ld_a16_addr = u8Pair(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        this._memory.writeByte(ld_a16_addr, this.A);
        break;

      case 0xeb:
      case 0xec:
      case 0xed:
      case 0xee:
        // XOR d8
        this._u8ExecuteXor(this._memory.readByte(this.PC++));
        break;

      case 0xef:
      case 0xf0:
        // LD A, (a8)
        const ld_a_a8 = this._memory.readByte(this.PC++);
        this.A = this._memory.readByte(0xff00 + ld_a_a8);
        break;

      case 0xf1:
        // POP AF
        this.AF = u8Pair(
          this._memory.readByte(this.SP++),
          this._memory.readByte(this.SP++)
        );
        break;

      case 0xf2:
        // LD A, (C)
        this.A = this._memory.readByte(0xff00 + this.C);
        break;

      case 0xf3:
      case 0xf4:
      case 0xf5:
        // PUSH AF
        const [push_af_low, push_af_high] = u16Unpair(this.AF);
        this._memory.writeByte(--this.SP, push_af_high);
        this._memory.writeByte(--this.SP, push_af_low);
        break;

      case 0xf6:
        // OR d8
        this._u8ExecuteOr(this._memory.readByte(this.PC++));
        break;

      case 0xf7:
      case 0xf8:
        // LD HL, SP+s8
        const ld_hl_s8 = this._memory.readByte(this.PC++);
        this.HL = this.SP + applySign(ld_hl_s8); // only when calculating HL we use the signed s8 value
        this.Z_FLAG = false;
        this.N_FLAG = false;
        // SP is 16bit and s8 is 8bit, but for the flag we consider this as a 8 bit operation and we apply appropriate masking
        this.H_FLAG =
          u8HalfCarryMask(this.SP) + u8HalfCarryMask(ld_hl_s8) > 0x0f;
        this.C_FLAG = u8Mask(this.SP) + u8Mask(ld_hl_s8) > 0xff;
        break;

      case 0xf9:
        // LD SP, HL
        this.SP = this.HL;
        break;

      case 0xfa:
        // LD A, (a16)
        const ld_a_addr = u8Pair(
          this._memory.readByte(this.PC++),
          this._memory.readByte(this.PC++)
        );
        this.A = this._memory.readByte(ld_a_addr);
        break;

      case 0xfb:
      case 0xfc:
      case 0xfd:
      case 0xfe:
        // CP d8
        this._u8ExecuteCp(this._memory.readByte(this.PC++));
        break;

      case 0xff:

      default:
        throw new Error(`Unknown opcode 0x${numToHex(opcode)}`);
    }
  }

  executeCbOpcode(cbOpcode: u8) {
    console.log("CB Opcode", numToHex(cbOpcode));

    switch (cbOpcode) {
      case 0x00:
        // RLC B
        this.B = this._executeRotateLeft(this.B);
        break;

      case 0x01:
        // RLC C
        this.C = this._executeRotateLeft(this.C);
        break;

      case 0x02:
        // RLC D
        this.D = this._executeRotateLeft(this.D);
        break;

      case 0x03:
        // RLC E
        this.E = this._executeRotateLeft(this.E);
        break;

      case 0x04:
        // RLC H
        this.H = this._executeRotateLeft(this.H);
        break;

      case 0x05:
        // RLC L
        this.L = this._executeRotateLeft(this.L);
        break;

      case 0x06:
        // RLC (HL)
        this._memory.writeByte(
          this.HL,
          this._executeRotateLeft(this._memory.readByte(this.HL))
        );
        break;

      case 0x07:
        // RLC A
        this.A = this._executeRotateLeft(this.A);
        break;

      case 0x08:
        // RRC B
        this.B = this._executeRotateRight(this.B);
        break;

      case 0x09:
        // RRC C
        this.C = this._executeRotateRight(this.C);
        break;

      case 0x0a:
        // RRC D
        this.D = this._executeRotateRight(this.D);
        break;

      case 0x0b:
        // RRC E
        this.E = this._executeRotateRight(this.E);
        break;

      case 0x0c:
        // RRC H
        this.H = this._executeRotateRight(this.H);
        break;

      case 0x0d:
        // RRC L
        this.L = this._executeRotateRight(this.L);
        break;

      case 0x0e:
        // RRC (HL)
        this._memory.writeByte(
          this.HL,
          this._executeRotateRight(this._memory.readByte(this.HL))
        );
        break;

      case 0x0f:
        // RRC A
        this.A = this._executeRotateRight(this.A);
        break;

      case 0x10:
        // RL B
        this.B = this._executeRotateLeftThroughCarry(this.B);
        break;

      case 0x11:
        // RL C
        this.C = this._executeRotateLeftThroughCarry(this.C);
        break;

      case 0x12:
        // RL D
        this.D = this._executeRotateLeftThroughCarry(this.D);
        break;

      case 0x13:
        // RL E
        this.E = this._executeRotateLeftThroughCarry(this.E);
        break;

      case 0x14:
        // RL H
        this.H = this._executeRotateLeftThroughCarry(this.H);
        break;

      case 0x15:
        // RL L
        this.L = this._executeRotateLeftThroughCarry(this.L);
        break;

      case 0x16:
        // RL (HL)
        this._memory.writeByte(
          this.HL,
          this._executeRotateLeftThroughCarry(this._memory.readByte(this.HL))
        );
        break;

      case 0x17:
        // RL A
        this.A = this._executeRotateLeftThroughCarry(this.A);
        break;

      case 0x18:
        // RR B
        this.B = this._executeRotateRightThroughCarry(this.B);
        break;

      case 0x19:
        // RR C
        this.C = this._executeRotateRightThroughCarry(this.C);
        break;

      case 0x1a:
        // RR D
        this.D = this._executeRotateRightThroughCarry(this.D);
        break;

      case 0x1b:
        // RR E
        this.E = this._executeRotateRightThroughCarry(this.E);
        break;

      case 0x1c:
        // RR H
        this.H = this._executeRotateRightThroughCarry(this.H);
        break;

      case 0x1d:
        // RR L
        this.L = this._executeRotateRightThroughCarry(this.L);
        break;

      case 0x1e:
        // RR (HL)
        this._memory.writeByte(
          this.HL,
          this._executeRotateRightThroughCarry(this._memory.readByte(this.HL))
        );
        break;

      case 0x1f:
        // RR A
        this.A = this._executeRotateRightThroughCarry(this.A);
        break;

      case 0x20:
        // SLA B
        this.B = this._executeShiftLeft(this.B);
        break;

      case 0x21:
        // SLA C
        this.C = this._executeShiftLeft(this.C);
        break;

      case 0x22:
        // SLA D
        this.D = this._executeShiftLeft(this.D);
        break;

      case 0x23:
        // SLA E
        this.E = this._executeShiftLeft(this.E);
        break;

      case 0x24:
        // SLA H
        this.H = this._executeShiftLeft(this.H);
        break;

      case 0x25:
        // SLA L
        this.L = this._executeShiftLeft(this.L);
        break;

      case 0x26:
        // SLA (HB)
        this._memory.writeByte(
          this.HL,
          this._executeShiftLeft(this._memory.readByte(this.HL))
        );
        break;

      case 0x27:
        // SLA A
        this.A = this._executeShiftLeft(this.A);
        break;

      case 0x28:
        // SRA B
        this.B = this._executeShiftRight(this.B);
        break;

      case 0x29:
        // SRA C
        this.C = this._executeShiftRight(this.C);
        break;

      case 0x2a:
        // SRA D
        this.D = this._executeShiftRight(this.D);
        break;

      case 0x2b:
        // SRA E
        this.E = this._executeShiftRight(this.E);
        break;

      case 0x2c:
        // SRA H
        this.H = this._executeShiftRight(this.H);
        break;

      case 0x2d:
        // SRA L
        this.L = this._executeShiftRight(this.L);
        break;

      case 0x2e:
        // SRA (HL)
        this._memory.writeByte(
          this.HL,
          this._executeShiftRight(this._memory.readByte(this.HL))
        );
        break;

      case 0x2f:
        // SRA A
        this.A = this._executeShiftRight(this.A);
        break;

      case 0x30:
        // SWAP B
        this.B = this._executeCbSwap(this.B);
        break;

      case 0x31:
        // SWAP C
        this.C = this._executeCbSwap(this.C);
        break;

      case 0x32:
        // SWAP D
        this.D = this._executeCbSwap(this.D);
        break;

      case 0x33:
        // SWAP E
        this.E = this._executeCbSwap(this.E);
        break;

      case 0x34:
        // SWAP H
        this.H = this._executeCbSwap(this.H);
        break;

      case 0x35:
        // SWAP L
        this.L = this._executeCbSwap(this.L);
        break;

      case 0x36:
        // SWAP (HL)
        this._memory.writeByte(
          this.HL,
          this._executeCbSwap(this._memory.readByte(this.HL))
        );
        break;

      case 0x37:
        // SWAP A
        this.A = this._executeCbSwap(this.A);
        break;

      case 0x38:
        // SRL B
        this.B = this._executeShiftRight(this.B, true);
        break;

      case 0x39:
        // SRL C
        this.C = this._executeShiftRight(this.C, true);
        break;

      case 0x3a:
        // SRL D
        this.D = this._executeShiftRight(this.D, true);
        break;

      case 0x3b:
        // SRL E
        this.E = this._executeShiftRight(this.E, true);
        break;

      case 0x3c:
        // SRL H
        this.H = this._executeShiftRight(this.H, true);
        break;

      case 0x3d:
        // SRL L
        this.L = this._executeShiftRight(this.L, true);
        break;

      case 0x3e:
        // SRL (HL)
        this._memory.writeByte(
          this.HL,
          this._executeShiftRight(this._memory.readByte(this.HL), true)
        );
        break;

      case 0x3f:
        // SRL A
        this.A = this._executeShiftRight(this.A, true);
        break;

      case 0x40:
        // BIT 0, B
        this._executeTestBit(this.B, 0);
        break;

      case 0x41:
        // BIT 0, C
        this._executeTestBit(this.C, 0);
        break;

      case 0x42:
        // BIT 0, D
        this._executeTestBit(this.D, 0);
        break;

      case 0x43:
        // BIT 0, E
        this._executeTestBit(this.E, 0);
        break;

      case 0x44:
        // BIT 0, H
        this._executeTestBit(this.H, 0);
        break;

      case 0x45:
        // BIT 0, L
        this._executeTestBit(this.L, 0);
        break;

      case 0x46:
        // BIT 0, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 0);
        break;

      case 0x47:
        // BIT 0, A
        this._executeTestBit(this.A, 0);
        break;

      case 0x48:
        // BIT 1, B
        this._executeTestBit(this.B, 1);
        break;

      case 0x49:
        // BIT 1, C
        this._executeTestBit(this.C, 1);
        break;

      case 0x4a:
        // BIT 1, D
        this._executeTestBit(this.D, 1);
        break;

      case 0x4b:
        // BIT 1, E
        this._executeTestBit(this.E, 1);
        break;

      case 0x4c:
        // BIT 1, H
        this._executeTestBit(this.H, 1);
        break;

      case 0x4d:
        // BIT 1, L
        this._executeTestBit(this.L, 1);
        break;

      case 0x4e:
        // BIT 1, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 1);
        break;

      case 0x4f:
        // BIT 1, A
        this._executeTestBit(this.A, 1);
        break;

      case 0x50:
        // BIT 2, B
        this._executeTestBit(this.B, 2);
        break;

      case 0x51:
        // BIT 2, C
        this._executeTestBit(this.C, 2);
        break;

      case 0x52:
        // BIT 2, D
        this._executeTestBit(this.D, 2);
        break;

      case 0x53:
        // BIT 2, E
        this._executeTestBit(this.E, 2);
        break;

      case 0x54:
        // BIT 2, H
        this._executeTestBit(this.H, 2);
        break;

      case 0x55:
        // BIT 2, L
        this._executeTestBit(this.L, 2);
        break;

      case 0x56:
        // BIT 0, 2HL)
        this._executeTestBit(this._memory.readByte(this.HL), 2);
        break;

      case 0x57:
        // BIT 2, A
        this._executeTestBit(this.A, 2);
        break;

      case 0x58:
        // BIT 3, B
        this._executeTestBit(this.B, 3);
        break;
      case 0x59:
        // BIT 3, C
        this._executeTestBit(this.C, 3);
        break;
      case 0x5a:
        // BIT 3, D
        this._executeTestBit(this.D, 3);
        break;
      case 0x5b:
        // BIT 3, E
        this._executeTestBit(this.E, 3);
        break;
      case 0x5c:
        // BIT 3, H
        this._executeTestBit(this.H, 3);
        break;
      case 0x5d:
        // BIT 3, L
        this._executeTestBit(this.L, 3);
        break;
      case 0x5e:
        // BIT 3, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 3);
        break;
      case 0x5f:
        // BIT 3, A
        this._executeTestBit(this.A, 3);
        break;

      case 0x60:
        // BIT 4, B
        this._executeTestBit(this.B, 4);
        break;
      case 0x61:
        // BIT 4, C
        this._executeTestBit(this.C, 4);
        break;
      case 0x62:
        // BIT 4, D
        this._executeTestBit(this.D, 4);
        break;
      case 0x63:
        // BIT 4, E
        this._executeTestBit(this.E, 4);
        break;
      case 0x64:
        // BIT 4, H
        this._executeTestBit(this.H, 4);
        break;
      case 0x65:
        // BIT 4, L
        this._executeTestBit(this.L, 4);
        break;
      case 0x66:
        // BIT 4, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 4);
        break;
      case 0x67:
        // BIT 4, A
        this._executeTestBit(this.A, 4);
        break;

      case 0x68:
        // BIT 5, B
        this._executeTestBit(this.B, 5);
        break;

      case 0x69:
        // BIT 5, C
        this._executeTestBit(this.C, 5);
        break;

      case 0x6a:
        // BIT 5, D
        this._executeTestBit(this.D, 5);
        break;

      case 0x6b:
        // BIT 5, E
        this._executeTestBit(this.E, 5);
        break;

      case 0x6c:
        // BIT 5, H
        this._executeTestBit(this.H, 5);
        break;

      case 0x6d:
        // BIT 5, L
        this._executeTestBit(this.L, 5);
        break;

      case 0x6e:
        // BIT 5, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 5);
        break;

      case 0x6f:
        // BIT 5, A
        this._executeTestBit(this.A, 5);
        break;

      case 0x70:
        // BIT 6, B
        this._executeTestBit(this.B, 6);
        break;

      case 0x71:
        // BIT 6, C
        this._executeTestBit(this.C, 6);
        break;

      case 0x72:
        // BIT 6, D
        this._executeTestBit(this.D, 6);
        break;

      case 0x73:
        // BIT 6, E
        this._executeTestBit(this.E, 6);
        break;

      case 0x74:
        // BIT 6, H
        this._executeTestBit(this.H, 6);
        break;

      case 0x75:
        // BIT 6, L
        this._executeTestBit(this.L, 6);
        break;

      case 0x76:
        // BIT 6, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 6);
        break;

      case 0x77:
        // BIT 6, A
        this._executeTestBit(this.A, 6);
        break;

      case 0x78:
        // BIT 7, B
        this._executeTestBit(this.B, 7);
        break;

      case 0x79:
        // BIT 7, C
        this._executeTestBit(this.C, 7);
        break;

      case 0x7a:
        // BIT 7, D
        this._executeTestBit(this.D, 7);
        break;

      case 0x7b:
        // BIT 7, E
        this._executeTestBit(this.E, 7);
        break;

      case 0x7c:
        // BIT 7, H
        this._executeTestBit(this.H, 7);
        break;

      case 0x7d:
        // BIT 7, L
        this._executeTestBit(this.L, 7);
        break;

      case 0x7e:
        // BIT 7, (HL)
        this._executeTestBit(this._memory.readByte(this.HL), 7);
        break;

      case 0x7f:
        // BIT 7, A
        this._executeTestBit(this.A, 7);
        break;

      case 0x80:
        // RES 0, B
        this.B = this._executeSetBit(this.B, 0, 0);
        break;

      case 0x81:
        // RES 0, C
        this.C = this._executeSetBit(this.C, 0, 0);
        break;

      case 0x82:
        // RES 0, D
        this.D = this._executeSetBit(this.D, 0, 0);
        break;

      case 0x83:
        // RES 0, E
        this.E = this._executeSetBit(this.E, 0, 0);
        break;

      case 0x84:
        // RES 0, H
        this.H = this._executeSetBit(this.H, 0, 0);
        break;

      case 0x85:
        // RES 0, L
        this.L = this._executeSetBit(this.L, 0, 0);
        break;

      case 0x86:
        // RES 0, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 0, 0)
        );
        break;

      case 0x87:
        // RES 0, A
        this.A = this._executeSetBit(this.A, 0, 0);
        break;

      case 0x88:
        // RES 1, B
        this.B = this._executeSetBit(this.B, 1, 0);
        break;

      case 0x89:
        // RES 1, C
        this.C = this._executeSetBit(this.C, 1, 0);
        break;

      case 0x8a:
        // RES 1, D
        this.D = this._executeSetBit(this.D, 1, 0);
        break;

      case 0x8b:
        // RES 1, E
        this.E = this._executeSetBit(this.E, 1, 0);
        break;

      case 0x8c:
        // RES 1, H
        this.H = this._executeSetBit(this.H, 1, 0);
        break;

      case 0x8d:
        // RES 1, L
        this.L = this._executeSetBit(this.L, 1, 0);
        break;

      case 0x8e:
        // RES 1, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 1, 0)
        );
        break;

      case 0x8f:
        // RES 1, A
        this.A = this._executeSetBit(this.A, 1, 0);
        break;

      case 0x90:
        // RES 2, B
        this.B = this._executeSetBit(this.B, 2, 0);
        break;

      case 0x91:
        // RES 2, C
        this.C = this._executeSetBit(this.C, 2, 0);
        break;

      case 0x92:
        // RES 2, D
        this.D = this._executeSetBit(this.D, 2, 0);
        break;

      case 0x93:
        // RES 2, E
        this.E = this._executeSetBit(this.E, 2, 0);
        break;

      case 0x94:
        // RES 2, H
        this.H = this._executeSetBit(this.H, 2, 0);
        break;

      case 0x95:
        // RES 2, L
        this.L = this._executeSetBit(this.L, 2, 0);
        break;

      case 0x96:
        // RES 2, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 2, 0)
        );
        break;

      case 0x97:
        // RES 2, A
        this.A = this._executeSetBit(this.A, 2, 0);
        break;

      case 0x98:
        // RES 3, B
        this.B = this._executeSetBit(this.B, 3, 0);
        break;

      case 0x99:
        // RES 3, C
        this.C = this._executeSetBit(this.C, 3, 0);
        break;

      case 0x9a:
        // RES 3, D
        this.D = this._executeSetBit(this.D, 3, 0);
        break;

      case 0x9b:
        // RES 3, E
        this.E = this._executeSetBit(this.E, 3, 0);
        break;

      case 0x9c:
        // RES 3, H
        this.H = this._executeSetBit(this.H, 3, 0);
        break;

      case 0x9d:
        // RES 3, L
        this.L = this._executeSetBit(this.L, 3, 0);
        break;

      case 0x9e:
        // RES 3, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 3, 0)
        );
        break;

      case 0x9f:
        // RES 3, A
        this.A = this._executeSetBit(this.A, 3, 0);
        break;

      case 0xa0:
        // RES 4, B
        this.B = this._executeSetBit(this.B, 4, 0);
        break;

      case 0xa1:
        // RES 4, C
        this.C = this._executeSetBit(this.C, 4, 0);
        break;

      case 0xa2:
        // RES 4, D
        this.D = this._executeSetBit(this.D, 4, 0);
        break;

      case 0xa3:
        // RES 4, E
        this.E = this._executeSetBit(this.E, 4, 0);
        break;

      case 0xa4:
        // RES 4, H
        this.H = this._executeSetBit(this.H, 4, 0);
        break;

      case 0xa5:
        // RES 4, L
        this.L = this._executeSetBit(this.L, 4, 0);
        break;

      case 0xa6:
        // RES 4, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 4, 0)
        );
        break;

      case 0xa7:
        // RES 4, A
        this.A = this._executeSetBit(this.A, 4, 0);
        break;

      case 0xa8:
        // RES 5, B
        this.B = this._executeSetBit(this.B, 5, 0);
        break;

      case 0xa9:
        // RES 5, C
        this.C = this._executeSetBit(this.C, 5, 0);
        break;

      case 0xaa:
        // RES 5, D
        this.D = this._executeSetBit(this.D, 5, 0);
        break;

      case 0xab:
        // RES 5, E
        this.E = this._executeSetBit(this.E, 5, 0);
        break;

      case 0xac:
        // RES 5, H
        this.H = this._executeSetBit(this.H, 5, 0);
        break;

      case 0xad:
        // RES 5, L
        this.L = this._executeSetBit(this.L, 5, 0);
        break;

      case 0xae:
        // RES 5, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 5, 0)
        );
        break;

      case 0xaf:
        // RES 5, A
        this.A = this._executeSetBit(this.A, 5, 0);
        break;

      case 0xb0:
        // RES 6, B
        this.B = this._executeSetBit(this.B, 6, 0);
        break;

      case 0xb1:
        // RES 6, C
        this.C = this._executeSetBit(this.C, 6, 0);
        break;

      case 0xb2:
        // RES 6, D
        this.D = this._executeSetBit(this.D, 6, 0);
        break;

      case 0xb3:
        // RES 6, E
        this.E = this._executeSetBit(this.E, 6, 0);
        break;

      case 0xb4:
        // RES 6, H
        this.H = this._executeSetBit(this.H, 6, 0);
        break;

      case 0xb5:
        // RES 6, L
        this.L = this._executeSetBit(this.L, 6, 0);
        break;

      case 0xb6:
        // RES 6, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 6, 0)
        );
        break;

      case 0xb7:
        // RES 6, A
        this.A = this._executeSetBit(this.A, 6, 0);
        break;

      case 0xb8:
        // RES 7, B
        this.B = this._executeSetBit(this.B, 7, 0);
        break;

      case 0xb9:
        // RES 7, C
        this.C = this._executeSetBit(this.C, 7, 0);
        break;

      case 0xba:
        // RES 7, D
        this.D = this._executeSetBit(this.D, 7, 0);
        break;

      case 0xbb:
        // RES 7, E
        this.E = this._executeSetBit(this.E, 7, 0);
        break;

      case 0xbc:
        // RES 7, H
        this.H = this._executeSetBit(this.H, 7, 0);
        break;

      case 0xbd:
        // RES 7, L
        this.L = this._executeSetBit(this.L, 7, 0);
        break;

      case 0xbe:
        // RES 7, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 7, 0)
        );
        break;

      case 0xbf:
        // RES 7, A
        this.A = this._executeSetBit(this.A, 7, 0);
        break;

      case 0xc0:
        // SET 0, B
        this.B = this._executeSetBit(this.B, 0, 1);
        break;

      case 0xc1:
        // SET 0, C
        this.C = this._executeSetBit(this.C, 0, 1);
        break;

      case 0xc2:
        // SET 0, D
        this.D = this._executeSetBit(this.D, 0, 1);
        break;

      case 0xc3:
        // SET 0, E
        this.E = this._executeSetBit(this.E, 0, 1);
        break;

      case 0xc4:
        // SET 0, H
        this.H = this._executeSetBit(this.H, 0, 1);
        break;

      case 0xc5:
        // SET 0, L
        this.L = this._executeSetBit(this.L, 0, 1);
        break;

      case 0xc6:
        // SET 0, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 0, 1)
        );
        break;

      case 0xc7:
        // SET 0, A
        this.A = this._executeSetBit(this.A, 0, 1);
        break;

      case 0xc8:
        // SET 1, B
        this.B = this._executeSetBit(this.B, 1, 1);
        break;

      case 0xc9:
        // SET 1, C
        this.C = this._executeSetBit(this.C, 1, 1);
        break;

      case 0xca:
        // SET 1, D
        this.D = this._executeSetBit(this.D, 1, 1);
        break;

      case 0xcb:
        // SET 1, E
        this.E = this._executeSetBit(this.E, 1, 1);
        break;

      case 0xcc:
        // SET 1, H
        this.H = this._executeSetBit(this.H, 1, 1);
        break;

      case 0xcd:
        // SET 1, L
        this.L = this._executeSetBit(this.L, 1, 1);
        break;

      case 0xce:
        // SET 1, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 1, 1)
        );
        break;

      case 0xcf:
        // SET 1, A
        this.A = this._executeSetBit(this.A, 1, 1);
        break;

      case 0xd0:
        // SET 2, B
        this.B = this._executeSetBit(this.B, 2, 1);
        break;

      case 0xd1:
        // SET 2, C
        this.C = this._executeSetBit(this.C, 2, 1);
        break;

      case 0xd2:
        // SET 2, D
        this.D = this._executeSetBit(this.D, 2, 1);
        break;

      case 0xd3:
        // SET 2, E
        this.E = this._executeSetBit(this.E, 2, 1);
        break;

      case 0xd4:
        // SET 2, H
        this.H = this._executeSetBit(this.H, 2, 1);
        break;

      case 0xd5:
        // SET 2, L
        this.L = this._executeSetBit(this.L, 2, 1);
        break;

      case 0xd6:
        // SET 2, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 2, 1)
        );
        break;

      case 0xd7:
        // SET 2, A
        this.A = this._executeSetBit(this.A, 2, 1);
        break;

      case 0xd8:
        // SET 3, B
        this.B = this._executeSetBit(this.B, 3, 1);
        break;

      case 0xd9:
        // SET 3, C
        this.C = this._executeSetBit(this.C, 3, 1);
        break;

      case 0xda:
        // SET 3, D
        this.D = this._executeSetBit(this.D, 3, 1);
        break;

      case 0xdb:
        // SET 3, E
        this.E = this._executeSetBit(this.E, 3, 1);
        break;

      case 0xdc:
        // SET 3, H
        this.H = this._executeSetBit(this.H, 3, 1);
        break;

      case 0xdd:
        // SET 3, L
        this.L = this._executeSetBit(this.L, 3, 1);
        break;

      case 0xde:
        // SET 3, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 3, 1)
        );
        break;

      case 0xdf:
        // SET 3, A
        this.A = this._executeSetBit(this.A, 3, 1);
        break;

      case 0xe0:
        // SET 4, B
        this.B = this._executeSetBit(this.B, 4, 1);
        break;

      case 0xe1:
        // SET 4, C
        this.C = this._executeSetBit(this.C, 4, 1);
        break;

      case 0xe2:
        // SET 4, D
        this.D = this._executeSetBit(this.D, 4, 1);
        break;

      case 0xe3:
        // SET 4, E
        this.E = this._executeSetBit(this.E, 4, 1);
        break;

      case 0xe4:
        // SET 4, H
        this.H = this._executeSetBit(this.H, 4, 1);
        break;

      case 0xe5:
        // SET 4, L
        this.L = this._executeSetBit(this.L, 4, 1);
        break;

      case 0xe6:
        // SET 4, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 4, 1)
        );
        break;

      case 0xe7:
        // SET 4, A
        this.A = this._executeSetBit(this.A, 4, 1);
        break;

      case 0xe8:
        // SET 5, B
        this.B = this._executeSetBit(this.B, 5, 1);
        break;

      case 0xe9:
        // SET 5, C
        this.C = this._executeSetBit(this.C, 5, 1);
        break;

      case 0xea:
        // SET 5, D
        this.D = this._executeSetBit(this.D, 5, 1);
        break;

      case 0xeb:
        // SET 5, E
        this.E = this._executeSetBit(this.E, 5, 1);
        break;

      case 0xec:
        // SET 5, H
        this.H = this._executeSetBit(this.H, 5, 1);
        break;

      case 0xed:
        // SET 5, L
        this.L = this._executeSetBit(this.L, 5, 1);
        break;

      case 0xee:
        // SET 5, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 5, 1)
        );
        break;

      case 0xef:
        // SET 5, A
        this.A = this._executeSetBit(this.A, 5, 1);
        break;

      case 0xf0:
        // SET 6, B
        this.B = this._executeSetBit(this.B, 6, 1);
        break;

      case 0xf1:
        // SET 6, C
        this.C = this._executeSetBit(this.C, 6, 1);
        break;

      case 0xf2:
        // SET 6, D
        this.D = this._executeSetBit(this.D, 6, 1);
        break;

      case 0xf3:
        // SET 6, E
        this.E = this._executeSetBit(this.E, 6, 1);
        break;

      case 0xf4:
        // SET 6, H
        this.H = this._executeSetBit(this.H, 6, 1);
        break;

      case 0xf5:
        // SET 6, L
        this.L = this._executeSetBit(this.L, 6, 1);
        break;

      case 0xf6:
        // SET 6, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 6, 1)
        );
        break;

      case 0xf7:
        // SET 6, A
        this.A = this._executeSetBit(this.A, 6, 1);
        break;

      case 0xf8:
        // SET 7, B
        this.B = this._executeSetBit(this.B, 7, 1);
        break;

      case 0xf9:
        // SET 7, C
        this.C = this._executeSetBit(this.C, 7, 1);
        break;

      case 0xfa:
        // SET 7, D
        this.D = this._executeSetBit(this.D, 7, 1);
        break;

      case 0xfb:
        // SET 7, E
        this.E = this._executeSetBit(this.E, 7, 1);
        break;

      case 0xfc:
        // SET 7, H
        this.H = this._executeSetBit(this.H, 7, 1);
        break;

      case 0xfd:
        // SET 7, L
        this.L = this._executeSetBit(this.L, 7, 1);
        break;

      case 0xfe:
        // SET 7, (HL)
        this._memory.writeByte(
          this.HL,
          this._executeSetBit(this._memory.readByte(this.HL), 7, 1)
        );
        break;

      case 0xff:
        // SET 7, A
        this.A = this._executeSetBit(this.A, 7, 1);
        break;

      default:
        throw new Error(`Unknown CB opcode 0x${cbOpcode}`);
    }
  }

  _u8ExecuteAdd(op: u8, carry: u8 = 0) {
    this.H_FLAG = u8HalfCarryMask(this.A) + u8HalfCarryMask(op) + carry > 0x0f;
    this.C_FLAG = this.A + op + carry > 0xff;
    this.A += op + carry;
    this.Z_FLAG = this.A === 0x00;
    this.N_FLAG = false;
  }

  _u16ExecuteAdd(op: u16) {
    this.H_FLAG = u16HalfCarryMask(this.HL) + u16HalfCarryMask(op) > 0x0fff;
    this.C_FLAG = this.HL + op > 0xffff;
    this.HL += op;
    this.N_FLAG = false;
  }

  _u8ExecuteSub(op: u8, carry: u8 = 0) {
    this.H_FLAG = u8HalfCarryMask(this.A) - u8HalfCarryMask(op) - carry < 0x00;
    this.C_FLAG = this.A - op - carry < 0x00;
    this.A -= op + carry;
    this.Z_FLAG = this.A === 0x00;
    this.N_FLAG = true;
  }

  _u8ExecuteAnd(op: u8) {
    this.A = this.A & op;
    this.Z_FLAG = this.A === 0x00;
    this.N_FLAG = false;
    this.H_FLAG = true;
    this.C_FLAG = false;
  }

  _u8ExecuteOr(op: u8) {
    this.A = this.A | op;
    this.Z_FLAG = this.A === 0x00;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = false;
  }

  _u8ExecuteXor(op: u8) {
    this.A = this.A ^ op;
    this.Z_FLAG = this.A === 0x00;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = false;
  }

  _u8ExecuteCp(op: u8) {
    this.Z_FLAG = this.A === op;
    this.N_FLAG = true;
    this.H_FLAG = u8HalfCarryMask(this.A) - u8HalfCarryMask(op) < 0x00;
    this.C_FLAG = this.A - op < 0x00;
  }

  _executeCbSwap(byte: u8) {
    const [low, high] = u8Unpair(byte);
    const result = u4Pair(high, low);
    this.Z_FLAG = result === 0x00;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = false;
    return result;
  }

  _executeRotateLeft(byte: u8, setZFlag: boolean = true) {
    const MSB = getBitAtPos(byte, 7);
    // shift left and move MSB bit to LSB
    const newValue = (byte << 1) | MSB;

    this.Z_FLAG = setZFlag ? newValue === 0 : false;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = Boolean(MSB);

    return newValue;
  }

  _executeRotateLeftThroughCarry(byte: u8, setZFlag: boolean = true) {
    const MSB = getBitAtPos(byte, 7);
    // shift left and move C_FLAG to LSB bit
    const newValue = (byte << 1) | Number(this.C_FLAG);

    this.Z_FLAG = setZFlag ? newValue === 0 : false;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = Boolean(MSB);

    return newValue;
  }

  _executeRotateRight(byte: u8, setZFlag: boolean = true) {
    const LSB = getBitAtPos(byte, 0);
    // shift right and move LSB bit to MSB
    const newValue = setBitAtPos(byte >> 1, 7, LSB);

    this.Z_FLAG = setZFlag ? newValue === 0 : false;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = Boolean(LSB);

    return newValue;
  }

  _executeRotateRightThroughCarry(byte: u8, setZFlag: boolean = true) {
    const LSB = getBitAtPos(byte, 0);
    // shift right and move LSB bit to MSB
    const newValue = setBitAtPos(byte >> 1, 7, Number(this.C_FLAG));

    this.Z_FLAG = setZFlag ? newValue === 0 : false;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = Boolean(LSB);

    return newValue;
  }

  _executeShiftLeft(byte: u8) {
    const MSB = getBitAtPos(byte, 7);
    // shift left and set LSB bit to 0
    const newValue = (byte << 1) | 0;

    this.Z_FLAG = newValue === 0;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = Boolean(MSB);

    return newValue;
  }

  _executeShiftRight(byte: u8, setMSBToZero: boolean = false) {
    const LSB = getBitAtPos(byte, 0);
    const MSB = getBitAtPos(byte, 7);
    // shift right and leave MSB unchanged
    const newValue = setBitAtPos(byte >> 1, 7, setMSBToZero ? 0 : MSB);

    this.Z_FLAG = newValue === 0;
    this.N_FLAG = false;
    this.H_FLAG = false;
    this.C_FLAG = Boolean(LSB);

    return newValue;
  }

  _executeTestBit(byte: u8, pos: number) {
    const value = getBitAtPos(byte, pos);
    this.Z_FLAG = value === 0;
    this.N_FLAG = false;
    this.H_FLAG = true;
  }

  _executeSetBit(byte: u8, pos: number, value: 1 | 0) {
    return setBitAtPos(byte, pos, value);
  }
}
