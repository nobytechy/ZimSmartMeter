import { describe, expect, it } from "vitest";
import { computeKwh } from "../tariff";

describe("computeKwh", () => {
  it("matches the database's round(x, 1) on the demo tariff", () => {
    expect(computeKwh(20, 2.94)).toBe(58.8);
    expect(computeKwh(10, 2.94)).toBe(29.4);
    expect(computeKwh(7.5, 2.94)).toBe(22.1);
    expect(computeKwh(5, 2.94)).toBe(14.7);
    expect(computeKwh(15, 2.94)).toBe(44.1);
  });
});
