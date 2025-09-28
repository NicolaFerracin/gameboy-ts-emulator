import {
  HBLANK_MODE,
  INTERRUPT_FLAG_ADDR,
  LCDC_ADDR,
  LY_ADDR,
  LYC_ADDR,
  OAM_MODE,
  PPU_RESERVED_MEMORY_END,
  PPU_RESERVED_MEMORY_START,
  STAT_ADDR,
  TRANSFER_MODE,
  VBLANK_MODE,
} from "./constants";
import { Memory } from "./memory";
import { Renderer } from "./renderer";
import { Mode, u8 } from "./types";
import { getBitAtPos, setBitAtPos, u8Mask } from "./utils";

const MAX_DOTS = 456;
const MAX_LY = 154;
const NORMALIZED_LCDC_ADDR = LCDC_ADDR - PPU_RESERVED_MEMORY_START;
const NORMALIZED_STAT_ADDR = STAT_ADDR - PPU_RESERVED_MEMORY_START;
const NORMALIZED_LYC_ADDR = LYC_ADDR - PPU_RESERVED_MEMORY_START;

export class PPU {
  private _reservedMemory: Uint8Array;
  private _mem: Memory | null;
  private _renderer: Renderer | null;
  private _ly: number = 0; // TODO narrow type to values 0..153
  private __mode: Mode = OAM_MODE;
  private __dot: number = 0; // TODO narrow type to values 0..455
  private _prevLyCoincidence = false;
  frameReady: boolean = false;
  winLine: number = 0;

  get ly(): number {
    return this._ly;
  }
  set ly(value: number) {
    this._ly = value % MAX_LY;
  }

  get _dot(): number {
    return this.__dot;
  }
  set _dot(value: number) {
    this.__dot = value % MAX_DOTS;
  }

  get _mode(): Mode {
    return this.__mode;
  }
  set _mode(value: Mode) {
    this.__mode = value;
  }

  constructor() {
    this._reservedMemory = new Uint8Array();
    this._mem = null;
    this._renderer = null;
  }

  allocateReservedMemory(reservedMemory: Uint8Array) {
    this._reservedMemory = reservedMemory;
  }

  attachMemory(memory: Memory) {
    this._mem = memory;
  }

  attachRenderer(renderer: Renderer) {
    this._renderer = renderer;
  }

  _isLCDOn = () =>
    getBitAtPos(this._reservedMemory[NORMALIZED_LCDC_ADDR], 7) === 1;

  _isBgOn = () =>
    getBitAtPos(this._reservedMemory[NORMALIZED_LCDC_ADDR], 0) === 1;
  _isWinOn = () =>
    getBitAtPos(this._reservedMemory[NORMALIZED_LCDC_ADDR], 5) === 1;

  isTileAddressingUnsigned = (): boolean =>
    getBitAtPos(this._reservedMemory[NORMALIZED_LCDC_ADDR], 4) === 1;

  getBgMapBase = (): number =>
    getBitAtPos(this._reservedMemory[NORMALIZED_LCDC_ADDR], 3) === 0
      ? 0x9800
      : 0x9c00;
  getWinMapBase = (): number =>
    getBitAtPos(this._reservedMemory[NORMALIZED_LCDC_ADDR], 6) === 0
      ? 0x9800
      : 0x9c00;

  _updateMode = () => {
    if (!this._mem) throw new Error("No Memory was attached to the PPU");
    if (!this._renderer) throw new Error("No Renderer was attached to the PPU");
    const currMode = this._mode;
    const newMode =
      this.ly >= 144 && this.ly <= 153
        ? VBLANK_MODE
        : this._dot < 80
        ? OAM_MODE
        : this._dot < 252
        ? TRANSFER_MODE
        : HBLANK_MODE;

    // Handle mode transitions
    if (currMode !== newMode) {
      let stat = this._getStat();

      // Fire STAT interrupt if enabled for mode
      const modeToStatInterrupt: Partial<Record<Mode, number>> = {
        [HBLANK_MODE]: 3,
        [VBLANK_MODE]: 4,
        [OAM_MODE]: 5,
      };
      let ifFlag = this._mem.getIF(true);
      const statBit = modeToStatInterrupt[newMode];
      if (typeof statBit === "number" && getBitAtPos(stat, statBit) === 1)
        ifFlag = setBitAtPos(ifFlag, 1, 1);

      if (newMode === VBLANK_MODE) {
        // Set IF bit0
        ifFlag = setBitAtPos(ifFlag, 0, 1);
        if (this._isLCDOn()) this._renderer.present();
      }

      if (newMode === TRANSFER_MODE && this._isLCDOn() && this.ly < 144) {
        this._renderer.renderScanline(this.ly);
      }

      // Write updated IF value
      this._mem.writeByte(INTERRUPT_FLAG_ADDR, ifFlag, true);
    }

    this._mode = newMode;
  };

  isRervedAddr(addr: u8) {
    return addr >= PPU_RESERVED_MEMORY_START && addr <= PPU_RESERVED_MEMORY_END;
  }

  readByte(addr: u8) {
    if (addr === STAT_ADDR) return this._getStat();
    else if (addr === LY_ADDR) return this.ly;
    return this._reservedMemory[addr - PPU_RESERVED_MEMORY_START];
  }

  writeByte(addr: u8, value: u8) {
    if (addr === STAT_ADDR) return this._setStat(value);
    else if (addr === LY_ADDR) this.ly = 0;
    else if (addr === LCDC_ADDR) {
      const wasLcdOn = this._isLCDOn();
      const isLcdOn = getBitAtPos(value, 7) === 1;
      // When turning the LCD on/off, we need to perform a bunch of resetting
      if (wasLcdOn !== isLcdOn) {
        this._mode = isLcdOn ? OAM_MODE : HBLANK_MODE;
        this._dot = 0;
        this.ly = 0;
        this.frameReady = false; // TODO remove?
        this._prevLyCoincidence = isLcdOn ? this._prevLyCoincidence : false;
        this._updateLyCoincidenceEdge();
      }
      this._reservedMemory[addr - PPU_RESERVED_MEMORY_START] = value;
    } else if (addr === LYC_ADDR) {
      this._reservedMemory[addr - PPU_RESERVED_MEMORY_START] = value;
      this._updateLyCoincidenceEdge();
    } else {
      this._reservedMemory[addr - PPU_RESERVED_MEMORY_START] = value;
    }
  }

  _getStat = () => {
    let stat = this._reservedMemory[NORMALIZED_STAT_ADDR];
    // Update STAT mode
    stat = setBitAtPos(stat, 0, getBitAtPos(this._mode, 0));
    stat = setBitAtPos(stat, 1, getBitAtPos(this._mode, 1));

    // update LYC==LY flag
    const lyc = this._reservedMemory[NORMALIZED_LYC_ADDR];
    stat = setBitAtPos(stat, 2, Number(lyc === this.ly));

    return stat;
  };

  _setStat = (value: u8) => {
    // we ignore bits 0..2 as they should be calculated on the fly when reading from the STAT address
    let stat = this._reservedMemory[NORMALIZED_STAT_ADDR];
    stat = setBitAtPos(stat, 3, getBitAtPos(value, 3));
    stat = setBitAtPos(stat, 4, getBitAtPos(value, 4));
    stat = setBitAtPos(stat, 5, getBitAtPos(value, 5));
    stat = setBitAtPos(stat, 6, getBitAtPos(value, 6));
    // bit 7 is unused
    this._reservedMemory[NORMALIZED_STAT_ADDR] = stat;
  };

  _updateLyCoincidenceEdge = () => {
    const newLyCoincidence =
      this._reservedMemory[NORMALIZED_LYC_ADDR] === this.ly;
    const stat = this._getStat();

    // if rising edge and STAT.6 enabled
    if (
      newLyCoincidence &&
      !this._prevLyCoincidence &&
      getBitAtPos(stat, 6) &&
      this._mem
    ) {
      // set IF.1
      this._mem.writeByte(
        INTERRUPT_FLAG_ADDR,
        setBitAtPos(this._mem.getIF(true), 1, 1),
        true
      );
    }

    this._prevLyCoincidence = newLyCoincidence;
  };

  _updateWinLine() {
    if (this._mem) {
      const winOn = this._isWinOn();
      const wy = this._mem.readByte(0xff4a, true);
      if (winOn && this.ly >= wy) this.winLine = u8Mask(this.winLine + 1);
      else this.winLine = 0; // or keep last; many emus reset when window not active
    }
  }

  tick(tCycles: number) {
    let dots = tCycles;
    if (!this._isLCDOn()) return;

    while (dots-- > 0) {
      // increase dot position
      this._dot++;

      // optionally increase LY
      if (this._dot === 0) {
        this.ly++;

        // Update winline
        this._updateWinLine();

        // Check LYC=LY coincidence edge
        this._updateLyCoincidenceEdge();
      }

      // set frame once we reach the end of the last visible scanlines
      if (this.ly === 144) this.frameReady = true; // TODO remove?

      // Update mode
      this._updateMode();
    }
  }
}
