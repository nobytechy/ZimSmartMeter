import { describe, expect, it } from "vitest";
import { formatZimPhone, normalizeZimPhone } from "../phone";

describe("normalizeZimPhone", () => {
  it("accepts all three Zimbabwean habits", () => {
    expect(normalizeZimPhone("0770000001")).toBe("+263770000001");
    expect(normalizeZimPhone("263770000001")).toBe("+263770000001");
    expect(normalizeZimPhone("+263770000001")).toBe("+263770000001");
    expect(normalizeZimPhone("0772 123 456")).toBe("+263772123456");
    expect(normalizeZimPhone("+263 77 123 4567")).toBe("+263771234567");
  });
  it("rejects everything that is not a Zim mobile", () => {
    expect(normalizeZimPhone("0870000001")).toBeNull(); // not 7-prefixed
    expect(normalizeZimPhone("77000")).toBeNull(); // too short
    expect(normalizeZimPhone("+27721234567")).toBeNull(); // South Africa
    expect(normalizeZimPhone("")).toBeNull();
  });
});

describe("formatZimPhone", () => {
  it("formats for display and passes through non-matches", () => {
    expect(formatZimPhone("+263770000001")).toBe("+263 77 000 0001");
    expect(formatZimPhone("weird")).toBe("weird");
  });
});
