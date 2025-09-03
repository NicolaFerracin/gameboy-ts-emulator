import { HBLANK_MODE, OAM_MODE, TRANSFER_MODE, VBLANK_MODE } from "./constants";
import { Memory } from "./memory";
import { Mode } from "./types";
import { getBitAtPos } from "./utils";

const LCDC_ADDR = 0xff40;
const MAX_DOTS = 456;
const MAX_LY = 154;

export class PPU {
  private _memory: Memory;
  private __ly: number = 0; // TODO narrow type to values 0..153
  private __mode: Mode = OAM_MODE;
  private __dot: number = 0; // TODO narrow type to values 0..455

  get _ly(): number {
    return this.__ly;
  }
  set _ly(value: number) {
    this.__ly = value % MAX_LY;
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

  constructor(memory: Memory) {
    this._memory = memory;
  }

  _isLCDOn = () => getBitAtPos(this._memory.readByte(LCDC_ADDR), 7) === 1;

  _getMode = () => {
    if (this._ly >= 144 && this._ly <= 153) return VBLANK_MODE;
    if (this._dot <= 79) return OAM_MODE;
    if (this._dot <= 251) return TRANSFER_MODE;
    return HBLANK_MODE;
  };

  tick(dots: number) {
    if (!this._isLCDOn()) return;

    while (dots > 0) {
      // decrease dots left
      dots--;
      // increase dot position
      this._dot++;
      // optionally increase LY
      if (this._dot === 0) this._ly++;
      // Update mode
      this._mode = this._getMode();
    }
  }
}
