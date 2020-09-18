import { lab } from "d3-color";

export function labDegreesToRgb(degrees, L, r) {
  const angle = (degrees * Math.PI) / 180;
  return lab(L, r * Math.cos(angle), r * Math.sin(angle))
    .rgb()
    .toString();
}
