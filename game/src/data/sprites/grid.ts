/** Applies recorded cell changes ("x,y,glyph" tokens separated by spaces) to a copy of a glyph grid. */
export function patchRows(rows: readonly string[], changes: string) {
  const cells = rows.map((row) => row.split(''));
  for (const token of changes.split(' ')) {
    if (!token) continue;
    const [x, y, glyph] = token.split(',');
    cells[Number(y)][Number(x)] = glyph;
  }
  return cells.map((row) => row.join(''));
}
