/**
 * Receipt impact estimator. Maps detected product keywords to CO2 estimates.
 * Real apps would call a product-emissions API; this provides a useful heuristic.
 */

export interface ReceiptItem {
  name: string;
  category: string;
  co2Kg: number;
}

const ITEM_FACTORS: Array<{ match: RegExp; category: string; co2Kg: number }> = [
  { match: /beef|steak|burger/i, category: "food", co2Kg: 27 },
  { match: /lamb/i, category: "food", co2Kg: 24 },
  { match: /pork|bacon|ham/i, category: "food", co2Kg: 12 },
  { match: /chicken|poultry|turkey/i, category: "food", co2Kg: 6 },
  { match: /fish|salmon|tuna|shrimp/i, category: "food", co2Kg: 5 },
  { match: /cheese/i, category: "food", co2Kg: 9 },
  { match: /milk|yogurt|butter/i, category: "food", co2Kg: 3 },
  { match: /egg/i, category: "food", co2Kg: 2 },
  { match: /rice/i, category: "food", co2Kg: 4 },
  { match: /bread|pasta|cereal/i, category: "food", co2Kg: 1.5 },
  { match: /vegetable|tomato|potato|lettuce|salad|carrot|onion/i, category: "food", co2Kg: 0.5 },
  { match: /fruit|apple|banana|berr/i, category: "food", co2Kg: 0.4 },
  { match: /coffee/i, category: "food", co2Kg: 2 },
  { match: /chocolate/i, category: "food", co2Kg: 4 },
  { match: /tshirt|t-shirt|shirt|jeans|dress/i, category: "shopping", co2Kg: 8 },
  { match: /shoes|sneakers/i, category: "shopping", co2Kg: 14 },
  { match: /electronic|phone|laptop|tablet/i, category: "shopping", co2Kg: 60 },
  { match: /plastic|bottle/i, category: "shopping", co2Kg: 0.5 },
];

/** Parse OCR text into normalized line items with CO2 estimates. */
export function parseReceiptText(text: string): ReceiptItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && /[a-zA-Z]/.test(l));
  const items: ReceiptItem[] = [];
  for (const line of lines) {
    for (const f of ITEM_FACTORS) {
      if (f.match.test(line)) {
        items.push({ name: cleanLineName(line), category: f.category, co2Kg: f.co2Kg });
        break;
      }
    }
  }
  return items;
}

function cleanLineName(s: string): string {
  return s
    .replace(/\s*\$?\d+[.,]?\d*\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function totalReceiptImpact(items: ReceiptItem[]): number {
  return Math.round(items.reduce((sum, i) => sum + i.co2Kg, 0) * 10) / 10;
}
