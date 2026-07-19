# Message collection API

`GET /api/messages` returns a JSON array of messages ordered from newest to
oldest. The array response is retained for compatibility with existing
consumers.

## Query parameters

- `limit` is optional, defaults to 50, and must be between 1 and 100. Every
  response is bounded by this value.
- `lastId` is an optional positive-integer cursor. When present, the endpoint
  returns only messages with a larger ID. Incremental pages are selected from
  oldest to newest before being returned in the normal newest-first order, so
  advancing the cursor cannot skip a burst larger than one page.
- `t` remains an optional cache-busting timestamp for polling requests.

The next `lastId` is the largest message ID received so far. Callers may request
again with that cursor to continue through newly published messages. An initial
request without `lastId` returns only the newest page rather than the complete
message table.
