# API

Carbon Coach has two server surfaces:

1. **Server routes** (`src/routes/api/*`) — raw HTTP endpoints.
2. **TanStack server functions** (`createServerFn`) — typed RPC called from
   components/loaders (none required yet, included for extensibility).

## `POST /api/chat`

Streaming AI Coach endpoint.

| Header                                  | Required | Notes                 |
| --------------------------------------- | -------- | --------------------- |
| `Content-Type: application/json`        | yes      |                       |
| `Authorization: Bearer <session token>` | yes      | enforced by the route |

### Request body

```json
{
  "threadId": "uuid | null",
  "message": "How can I cut my commute emissions?",
  "context": {
    "score": 62,
    "topCategory": "transport"
  }
}
```

### Response

Server-Sent Events. Each chunk is `{ "delta": "..." }`; the stream ends with
`event: done`.

## Database RPCs

| RPC                           | Args           | Returns                                                          | Access          |
| ----------------------------- | -------------- | ---------------------------------------------------------------- | --------------- |
| `get_leaderboard(_limit int)` | `_limit ≤ 100` | top users — id, display_name, avatar_url, points, current_streak | `authenticated` |
| `get_challenge_progress()`    | –              | `(challenge_id, participant_count, total_kg)` aggregates         | `authenticated` |

Call from the client:

```ts
const { data } = await supabase.rpc("get_leaderboard", { _limit: 20 });
```

## Direct table access

Most reads/writes use `supabase.from("<table>")` directly. RLS ensures the
client can only see/touch its own rows. See [DATABASE.md](./DATABASE.md) for
the full schema and policies.
