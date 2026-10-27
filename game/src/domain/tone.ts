/** Suy bốn tông bóng từ một màu trang bị (thuần). Tông gốc giữ nguyên hex; ba tông còn lại đổi độ sáng OKLab. */
export interface ToneRamp {
  readonly hi: string;
  readonly base: string;
  readonly shade: string;
  readonly deep: string;
}

type Lab = readonly [number, number, number];

const LIGHTNESS_STEP = {hi: 0.1, shade: -0.1, deep: -0.2} as const;

function toLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number) {
  const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}

function parseHex(hex: string) {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('màu trang bị không hợp lệ ' + hex);
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}

export function hexToOklab(hex: string): Lab {
  const [red, green, blue] = parseHex(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToHex([lightness, a, b]: Lab) {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return '#' + channels.map((value) => fromLinear(value).toString(16).padStart(2, '0')).join('');
}

/** Four tones of one material: highlight, the approved base, shade and deep edge, lightest to darkest. */
export function toneRamp(hex: string): ToneRamp {
  const [lightness, a, b] = hexToOklab(hex);
  const at = (step: number, chroma: number) => {
    const clamped = Math.min(1, Math.max(0, lightness + step));
    return oklabToHex([clamped, a * chroma, b * chroma]);
  };
  return {
    hi: at(LIGHTNESS_STEP.hi, 0.96),
    base: hex,
    shade: at(LIGHTNESS_STEP.shade, 1.02),
    deep: at(LIGHTNESS_STEP.deep, 1.05),
  };
}
