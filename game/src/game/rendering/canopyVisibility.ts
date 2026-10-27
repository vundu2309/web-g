/** Biên độ xoay tối đa; dùng cùng giá trị cho animation và vùng kiểm tra hiển thị. */
export const CANOPY_SWAY = 0.02;
interface View {
  x: number;
  y: number;
  right: number;
  bottom: number;
}
/** Tính cả bề rộng tán, chiều cao và đệm xoay: gốc ngoài camera không có nghĩa tán đã khuất. */
export function canopyInView(x: number, y: number, width: number, height: number, originX: number, view: View) {
  const margin = height * CANOPY_SWAY + 2;
  const left = x - width * originX - margin;
  const top = y - height - margin;
  return left <= view.right && left + width + margin * 2 >= view.x && top <= view.bottom && y + margin >= view.y;
}
