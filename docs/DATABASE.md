# Database schema

All tables live in the `public` schema with RLS enabled and `auth.uid()`
scoped policies (except curated read-only seeds and the safe leaderboard
RPC).

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "1:1 (trigger)"
  AUTH_USERS ||--o{ ASSESSMENTS : has
  AUTH_USERS ||--o{ MISSIONS : owns
  AUTH_USERS ||--o{ RECEIPTS : uploads
  AUTH_USERS ||--o{ EMISSIONS_LOG : logs
  AUTH_USERS ||--o{ CHAT_THREADS : owns
  AUTH_USERS ||--o{ USER_BADGES : earns
  AUTH_USERS ||--o{ CHALLENGE_PARTICIPANTS : joins
  CHAT_THREADS ||--o{ CHAT_MESSAGES : contains
  BADGES ||--o{ USER_BADGES : awarded
  CHALLENGES ||--o{ CHALLENGE_PARTICIPANTS : tracks

  PROFILES {
    uuid id PK
    text display_name
    text avatar_url
    int points
    int current_streak
    int longest_streak
  }
  ASSESSMENTS {
    uuid id PK
    uuid user_id FK
    jsonb inputs
    numeric transport_kg
    numeric electricity_kg
    numeric food_kg
    numeric shopping_kg
    numeric waste_kg
    numeric total_kg
    int score
  }
  MISSIONS {
    uuid id PK
    uuid user_id FK
    text title
    text category
    numeric estimated_co2_kg
    int points
    date week_start
    bool completed
    text proof_url
    text verification_status
  }
  CHALLENGES {
    uuid id PK
    text slug UK
    text name
    text category
    numeric goal_co2_kg
    timestamptz ends_at
  }
  CHALLENGE_PARTICIPANTS {
    uuid challenge_id PK,FK
    uuid user_id PK,FK
    numeric contributed_kg
  }
```

## Security-sensitive surfaces

| Object | Why | Access |
|---|---|---|
| `profiles` SELECT | leaderboard previously needed broad reads — now only own row | `auth.uid() = id` |
| `public.get_leaderboard()` | returns whitelisted public columns only | `authenticated` |
| `public.get_challenge_progress()` | aggregate counts only (no PII) | `authenticated` |
| `mission-proofs` storage bucket | private; folder = `auth.uid()` | own folder only |

See [SECURITY.md](./SECURITY.md) for the full threat model.
