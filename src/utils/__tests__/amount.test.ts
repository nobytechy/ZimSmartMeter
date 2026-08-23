import { describe, expect, it } from "vitest";
import { isValidAmount } from "../amount";

describe("isValidAmount", () => {
  it("accepts the legal range with up to two decimals", () => {
    for (const ok of ["5", "7.50", "20", "999.99", "1000"]) {
      expect(isValidAmount(ok)).toBe(true);
    }
  });
  it("rejects everything the database would reject", () => {
    for (const bad of ["4.99", "1000.01", "10.123", "abc", "", "-20", "5."]) {
      expect(isValidAmount(bad)).toBe(false);
    }
  });
});
