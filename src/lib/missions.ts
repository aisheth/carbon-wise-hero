/**
 * Weekly Eco Mission generator.
 * Deterministically picks a varied set based on the user's top emission categories.
 */
import type { CategoryBreakdown } from "./carbon";

export interface MissionTemplate {
  id: string;
  category: keyof CategoryBreakdown;
  title: string;
  description: string;
  estimatedCo2Kg: number;
  points: number;
}

export const MISSION_LIBRARY: MissionTemplate[] = [
  {
    id: "m_transit_3x",
    category: "transport",
    title: "Use transit or bike 3 times this week",
    description: "Leave the car at home for at least three trips.",
    estimatedCo2Kg: 8,
    points: 30,
  },
  {
    id: "m_carpool",
    category: "transport",
    title: "Carpool once this week",
    description: "Share a ride with a friend or colleague.",
    estimatedCo2Kg: 4,
    points: 15,
  },
  {
    id: "m_wfh",
    category: "transport",
    title: "Work from home one extra day",
    description: "Skip the commute for a day to cut transport emissions.",
    estimatedCo2Kg: 6,
    points: 20,
  },
  {
    id: "m_thermostat",
    category: "electricity",
    title: "Lower thermostat by 1°C all week",
    description: "Cuts heating energy by roughly 7%.",
    estimatedCo2Kg: 5,
    points: 20,
  },
  {
    id: "m_unplug",
    category: "electricity",
    title: "Unplug 5 idle devices",
    description: "Phantom load can account for ~10% of home electricity.",
    estimatedCo2Kg: 2,
    points: 10,
  },
  {
    id: "m_cold_wash",
    category: "electricity",
    title: "Wash laundry on cold for a week",
    description: "Cold water cuts ~70% of a wash cycle's energy.",
    estimatedCo2Kg: 3,
    points: 15,
  },
  {
    id: "m_meatless_3",
    category: "food",
    title: "Eat plant-based 3 dinners this week",
    description: "Plant meals emit ~75% less CO₂ than beef-based ones.",
    estimatedCo2Kg: 9,
    points: 30,
  },
  {
    id: "m_local_market",
    category: "food",
    title: "Shop at a local market once",
    description: "Cut transport emissions for produce by sourcing locally.",
    estimatedCo2Kg: 2,
    points: 10,
  },
  {
    id: "m_no_waste",
    category: "food",
    title: "Zero food waste challenge",
    description: "Plan meals to use everything you buy this week.",
    estimatedCo2Kg: 4,
    points: 20,
  },
  {
    id: "m_secondhand",
    category: "shopping",
    title: "Buy one secondhand item instead of new",
    description: "Reusing avoids new manufacturing emissions entirely.",
    estimatedCo2Kg: 6,
    points: 20,
  },
  {
    id: "m_no_buy",
    category: "shopping",
    title: "No-buy week (non-essentials)",
    description: "Pause discretionary shopping for 7 days.",
    estimatedCo2Kg: 10,
    points: 30,
  },
  {
    id: "m_recycle",
    category: "waste",
    title: "Sort and recycle for the full week",
    description: "Properly sort paper, plastic, glass, and metal.",
    estimatedCo2Kg: 3,
    points: 15,
  },
  {
    id: "m_compost",
    category: "waste",
    title: "Start composting food scraps",
    description: "Composting prevents methane emissions from landfill.",
    estimatedCo2Kg: 4,
    points: 20,
  },
  {
    id: "m_reusable",
    category: "waste",
    title: "Use a reusable cup/bottle all week",
    description: "Skip single-use cups for every coffee and drink.",
    estimatedCo2Kg: 1,
    points: 10,
  },
];

/** Returns the Monday (UTC) of the week containing `date`. */
export function weekStart(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // 1..7, Mon..Sun
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

/** Returns an ISO yyyy-mm-dd string. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Picks N weekly missions weighted toward the user's heaviest categories.
 * Deterministic for a given (week, breakdown) so the dashboard shows the same set on reload.
 */
export function generateWeeklyMissions(
  breakdown: CategoryBreakdown,
  weekIso: string,
  count = 3,
): MissionTemplate[] {
  const ranked = (Object.entries(breakdown) as Array<[keyof CategoryBreakdown, number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  const seed = hashString(weekIso);
  const chosen: MissionTemplate[] = [];
  const usedIds = new Set<string>();

  for (const cat of ranked) {
    if (chosen.length >= count) break;
    const pool = MISSION_LIBRARY.filter((m) => m.category === cat && !usedIds.has(m.id));
    if (pool.length === 0) continue;
    const pick = pool[seed % pool.length];
    chosen.push(pick);
    usedIds.add(pick.id);
  }
  // Top up from full library if needed
  let i = 0;
  while (chosen.length < count && i < MISSION_LIBRARY.length) {
    const m = MISSION_LIBRARY[(seed + i) % MISSION_LIBRARY.length];
    if (!usedIds.has(m.id)) {
      chosen.push(m);
      usedIds.add(m.id);
    }
    i++;
  }
  return chosen;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
