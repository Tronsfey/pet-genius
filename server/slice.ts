import sharp from 'sharp';

// Stub for B5. The full controlled-layout grid slicer (alpha-trim,
// center-of-mass pivot, drop-empty-cells) lands when the gpt-image-1
// path is wired up in B5.
export async function sliceGrid(
  png: Buffer,
  cols: number,
  rows: number,
): Promise<{ col: number; row: number; png: Buffer }[]> {
  const meta = await sharp(png).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w === 0 || h === 0) throw new Error('sliceGrid: empty image');
  const cw = Math.floor(w / cols);
  const ch = Math.floor(h / rows);
  const out: { col: number; row: number; png: Buffer }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = await sharp(png)
        .extract({ left: c * cw, top: r * ch, width: cw, height: ch })
        .toBuffer();
      out.push({ col: c, row: r, png: cell });
    }
  }
  return out;
}
