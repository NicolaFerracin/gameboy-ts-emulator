export class PPU {
  private mCycles: number;

  constructor() {
    this.mCycles = 0;
  }

  advance(cycles: number) {
    this.mCycles += cycles;
  }
}
