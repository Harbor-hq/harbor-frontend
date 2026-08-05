import { describe, it, expect } from "vitest";
import { toBaseUnits, fromBaseUnits } from "./harbor";

describe("toBaseUnits / fromBaseUnits amount converters", () => {
  describe("toBaseUnits", () => {
    it("converts simple decimal strings to base units", () => {
      expect(toBaseUnits("123.45", 6)).toBe(BigInt("123450000"));
      expect(toBaseUnits("1", 6)).toBe(BigInt("1000000"));
      expect(toBaseUnits("0.000001", 6)).toBe(BigInt("1"));
    });

    it("converts negative decimal strings", () => {
      expect(toBaseUnits("-123.45", 6)).toBe(BigInt("-123450000"));
      expect(toBaseUnits("-0.000001", 6)).toBe(BigInt("-1"));
    });

    it("converts zero properly", () => {
      expect(toBaseUnits("0", 6)).toBe(BigInt("0"));
      expect(toBaseUnits("0.0", 6)).toBe(BigInt("0"));
      expect(toBaseUnits("-0.0", 6)).toBe(BigInt("0"));
    });

    it("converts with >18 decimals", () => {
      expect(toBaseUnits("1.00000000000000000001", 20)).toBe(BigInt("100000000000000000001"));
    });

    it("converts large i128 values without precision loss", () => {
      // 170141183460469231731687303715884105727 is the max positive i128
      const largeNum = "170141183460469231731687303715884105.727";
      expect(toBaseUnits(largeNum, 3)).toBe(BigInt("170141183460469231731687303715884105727"));
    });

    it("throws on empty or whitespace-only input", () => {
      expect(() => toBaseUnits("", 6)).toThrow("Empty amount");
      expect(() => toBaseUnits("   ", 6)).toThrow("Empty amount");
    });

    it("throws on malformed inputs", () => {
      expect(() => toBaseUnits("abc", 6)).toThrow("Invalid amount");
      expect(() => toBaseUnits("12.34.56", 6)).toThrow("Invalid amount");
      expect(() => toBaseUnits("12-34", 6)).toThrow("Invalid amount");
    });
  });

  describe("fromBaseUnits", () => {
    it("formats base units to simple decimal strings", () => {
      expect(fromBaseUnits(BigInt("123450000"), 6)).toBe("123.45");
      expect(fromBaseUnits(BigInt("1000000"), 6)).toBe("1");
      expect(fromBaseUnits(BigInt("1"), 6)).toBe("0.000001");
    });

    it("formats negative base units", () => {
      expect(fromBaseUnits(BigInt("-123450000"), 6)).toBe("-123.45");
      expect(fromBaseUnits(BigInt("-1"), 6)).toBe("-0.000001");
    });

    it("formats zero properly", () => {
      expect(fromBaseUnits(BigInt("0"), 6)).toBe("0");
    });

    it("formats with >18 decimals", () => {
      expect(fromBaseUnits(BigInt("1000000000000000000001"), 20)).toBe("10.00000000000000000001");
    });

    it("formats large i128 values without precision loss", () => {
      const largeBase = BigInt("170141183460469231731687303715884105727");
      expect(fromBaseUnits(largeBase, 3)).toBe("170141183460469231731687303715884105.727");
    });

    it("accepts number and string representations of base units", () => {
      expect(fromBaseUnits(123450000, 6)).toBe("123.45");
      expect(fromBaseUnits("123450000", 6)).toBe("123.45");
    });
  });

  describe("Round-trip stability", () => {
    it("preserves exact amounts when converting back and forth", () => {
      const original = "54321.098765";
      const base = toBaseUnits(original, 6);
      const output = fromBaseUnits(base, 6);
      expect(output).toBe(original);
    });
  });
});
