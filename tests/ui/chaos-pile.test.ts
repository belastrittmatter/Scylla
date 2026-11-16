import { describe, it, expect } from "bun:test";
import { tiltToGravity } from "@/components/landing/chaos-pile";

// + 0 folds -0 into 0 so toEqual compares directions, not float sign bits.
const g = (beta: number, gamma: number, angle: number) => {
  const { x, y } = tiltToGravity(beta, gamma, angle);
  return { x: x + 0, y: y + 0 };
};

describe("tiltToGravity", () => {
  it("maps portrait tilt straight through and clamps at 45°", () => {
    expect(g(90, 0, 0)).toEqual({ x: 0, y: 1.2 });
    expect(g(0, -90, 0)).toEqual({ x: -1.2, y: 0 });
  });

  it("swaps axes in landscape so screen-down stays down", () => {
    // Phone upright in landscape (top edge to the left): left side points down.
    expect(g(0, -90, 90)).toEqual({ x: 0, y: 1.2 });
    expect(g(0, 90, 270)).toEqual({ x: 0, y: 1.2 });
    expect(g(90, 0, 180)).toEqual({ x: 0, y: -1.2 });
  });
});
