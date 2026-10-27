/**
 * Alpha lần lượt cho các lớp vẽ chồng lên nhau để hợp thành đúng trọng số: lớp thứ i có alpha w_i / (w_1 + ... + w_i).
 * Lớp đầu tiên có trọng số dương sẽ có alpha 1. Nhờ vậy không cần lớp nền riêng và không cấp phát.
 */
export function stackAlphas(weights: ArrayLike<number>, out: Float64Array) {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    out[i] = sum > 0 ? Math.min(1, weights[i] / sum) : 0;
  }
}
