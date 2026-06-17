# Testing

## Layers

| Layer | Tools | Lives in | Purpose |
|---|---|---|---|
| Unit | Vitest | `tests/unit/` | Pure functions: `carbon`, `missions`, `receipt`, `impact` |
| Integration | Vitest + mocked Supabase | `tests/integration/` | Verifies the data-layer calls correct tables/payloads |
| Component | Vitest + Testing Library + jsdom | `tests/components/` | Smoke tests for shadcn-derived UI primitives |
| (Optional) E2E | Playwright | `e2e/` | Sign-up → assessment → dashboard happy path |

## Running

```bash
bun run test          # watch mode
bun run test:run      # single run
bun run test:coverage # with V8 coverage report → ./coverage
```

Coverage thresholds (`vitest.config.ts`):
- 80% lines / statements / functions, 70% branches on `src/lib` and `src/components`.
- `src/components/ui/*` excluded (vendored shadcn primitives).

## Writing a new unit test

```ts
import { describe, it, expect } from "vitest";
import { computeImpact } from "../../src/lib/impact";

describe("computeImpact", () => {
  it("returns zeros for non-positive input", () => {
    expect(computeImpact(0).trees).toBe(0);
  });
});
```

Pure functions go in `tests/unit/`. Anything that touches Supabase belongs in
`tests/integration/` and must mock the client.

## CI

`.github/workflows/ci.yml` runs on every push and pull request:
1. `bun install --frozen-lockfile`
2. `bun run lint`
3. `bunx tsc --noEmit`
4. `bunx vitest run --coverage` (uploads `coverage/` as an artifact)
5. `bun run build` (blocks deploy if any prior step fails)

## Accessibility checks

Component tests assert ARIA labels on icon-only buttons. For full WCAG audits,
plug `@axe-core/playwright` into the E2E suite.
