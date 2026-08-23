import { describe, expect, it } from "vitest";
import {
  formatMeterNumber,
  isValidMeterNumber,
  normalizeMeterNumber,
} from "../meterNumber";

const seeds = [
  "04789846773",
  "04147052668",
  "04954653178",
  "04545682827",
  "04514800855",
];

describe("isValidMeterNumber (Luhn)", () => {
  it("accepts every seeded registry number", () => {
    for (const n of seeds) expect(isValidMeterNumber(n)).toBe(true);
  });
  it("catches a single mistyped digit", () => {
    expect(isValidMeterNumber("04789846772")).toBe(false);
  });
  it("rejects wrong lengths", () => {
    expect(isValidMeterNumber("0478984677")).toBe(false);
    expect(isValidMeterNumber("047898467731")).toBe(false);
  });
});

describe("normalize/format", () => {
  it("strips noise and caps at 11 digits", () => {
    expect(normalizeMeterNumber("0495 4653 178")).toBe("04954653178");
    expect(normalizeMeterNumber("04954653178999")).toBe("04954653178");
  });
  it("groups 4-4-3 for display", () => {
    expect(formatMeterNumber("04954653178")).toBe("0495 4653 178");
  });
});
