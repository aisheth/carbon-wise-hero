# Features

This folder is reserved for feature-scoped modules — components, hooks,
and helpers that belong to one product area (assessment, missions,
challenges, scanner, …) and are not shared across the app.

Cross-cutting concerns live elsewhere:

- Pure business logic / calculations → `src/services/`
- Generic reusable hooks → `src/hooks/`
- Shared domain types → `src/types/`
- Generic helpers (class-name combinator, math) → `src/utils/`
- Reusable presentational UI → `src/components/`

When extracting code from a route file under `src/routes/`, prefer placing
feature-specific subcomponents here (e.g. `src/features/assessment/`) and
keep the route file focused on routing, data wiring, and composition.
