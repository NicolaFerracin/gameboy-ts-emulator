export class GBScreen {
  // DMG-like grayscale palette (lightest→darkest)
  private palette: [number, number, number, number][] = [
    [224, 248, 208, 255], // shade 0
    [136, 192, 112, 255], // shade 1
    [52, 104, 86, 255], // shade 2
    [8, 24, 32, 255], // shade 3
  ];

  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private rgba: Uint8ClampedArray;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.ctx = ctx;
    this.imageData = new ImageData(canvas.width, canvas.height);
    this.rgba = this.imageData.data;
  }

  print(shades: Uint8Array) {
    for (let i = 0, p = 0; i < shades.length; i++, p += 4) {
      const [r, g, b, a] = this.palette[shades[i]];
      this.rgba[p + 0] = r;
      this.rgba[p + 1] = g;
      this.rgba[p + 2] = b;
      this.rgba[p + 3] = a;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
