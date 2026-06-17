import { describe, it, expect } from "vitest";
import { parseReceiptText, totalReceiptImpact } from "../../src/lib/receipt";

describe("parseReceiptText", () => {
  it("identifies common grocery items", () => {
    const items = parseReceiptText(`Beef Ribeye 18.99\nMilk Carton 3.49\nApples 2.50`);
    expect(items).toHaveLength(3);
    expect(items[0].category).toBe("food");
    expect(items.find((i) => /apple/i.test(i.name))).toBeDefined();
  });
  it("strips trailing prices from item names", () => {
    const [item] = parseReceiptText("Cheddar Cheese 6.20");
    expect(item.name).not.toMatch(/6\.20/);
  });
  it("returns empty for unrecognized text", () => {
    expect(parseReceiptText("xyzzy 1.99\nfoo bar 2.50")).toEqual([]);
  });
  it("ignores lines that are too short", () => {
    expect(parseReceiptText("a\nbb\n")).toEqual([]);
  });
});

describe("totalReceiptImpact", () => {
  it("sums and rounds to 1 decimal", () => {
    expect(
      totalReceiptImpact([
        { name: "Beef", category: "food", co2Kg: 27 },
        { name: "Milk", category: "food", co2Kg: 3 },
      ]),
    ).toBe(30);
  });
  it("returns 0 for empty list", () => {
    expect(totalReceiptImpact([])).toBe(0);
  });
});
