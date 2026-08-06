# Real-Time Collaboration

Lenzro supports real-time collaborative editing — multiple users can view and edit the same page simultaneously, see each other's cursors, and receive instant updates without refreshing.

---

## Table of Contents

- [Overview](#overview)
- [WebSocket Gateway](#websocket-gateway)
- [Rooms and Subscriptions](#rooms-and-subscriptions)
- [Collaborative Editing](#collaborative-editing)
- [Presence and Cursors](#presence-and-cursors)
- [Comment Notifications](#comment-notifications)
- [Horizontal Scaling](#horizontal-scaling)
- [Client Integration](#client-integration)
- [Events Reference](#events-reference)

---

## Overview

```
┌──────────────┐     WebSocket     ┌─────────────────────────┐
│  Browser A   │◄─────────────────►│                         │
│  (editing)   │                   │   NestJS WS Gateway     │
└──────────────┘                   │   (Socket.IO)           │
                                   │                         │
┌──────────────┐     WebSocket     │   Rooms:                │
│  Browser B   │◄─────────────────►│   • page:{pageId}       │
│  (viewing)   │                   │   • workspace:{wsId}    │
└──────────────┘                   └────────────┬────────────┘
                                                │
                                   ┌────────────▼────────────┐
                                   │   Redis Pub/Sub         │
                                   │   (cross-instance sync) │
                                   └─────────────────────────┘
```

Real-time is built on **Socket.IO** served by the NestJS `@WebSocketGateway`. Redis Pub/Sub (via `socket.io-redis` adapter) ensures events are broadcast across all API instances in a horizontally scaled deployment.

---

## WebSocket Gateway

Connection URL: `wss://api.lenzro.com/realtime`

Authentication: the client sends the JWT access token on connection:

```typescript
// Client
const socket = io('wss://api.lenzro.com/realtime', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

The gateway verifies the token on every connection. Expired connections are closed with code `4001` — the client should refresh the token and reconnect.

---

## Rooms and Subscriptions

### Page Room — `page:{pageId}`

Joined when a user opens a page. Carries:
- Live document changes (OT/CRDT operations)
- Cursor and selection positions
- Presence (who is currently viewing/editing)
- Comment events (new, resolved, deleted)

### Workspace Room — `workspace:{workspaceId}`

Joined when a user opens the workspace sidebar. Carries:
- Page tree mutations (create, rename, move, archive, delete)
- Member join/leave events
- Notification badges

---

## Collaborative Editing

### Strategy: Server-Authoritative OT

Lenzro uses **server-authoritative Operational Transformation (OT)** for text content and **Last-Write-Wins (LWW)** for block-level structural changes (add/move/delete a block). This avoids the complexity of full CRDT while handling the most common conflict scenarios.

```
Client A                  Server                 Client B
   │                        │                       │
   │  op: insert "H" at 5   │                       │
   │───────────────────────►│                       │
   │                        │  Apply to doc         │
   │                        │  version: n → n+1     │
   │◄───────────────────────│                       │
   │  ack { version: n+1 }  │──────────────────────►│
   │                        │  broadcast op (n+1)   │
   │                        │                       │ apply op
```

1. Client sends an **operation** with the last known document version (`baseVersion`).
2. Server transforms the op against any concurrent ops that arrived first.
3. Server applies the transformed op, increments document version.
4. Server acknowledges the sender and broadcasts to all others in the room.

**Conflict resolution rules:**
- Concurrent text inserts at the same offset: tie-broken by user ID (deterministic).
- Concurrent block deletes: last delete wins; editors who deleted a block the other user was editing receive a notification.
- Structural moves: LWW by server arrival time.

### Saving

The authoritative document state is **persisted to Postgres every 3 seconds** (debounced) after any change via `PATCH /pages/:id`. The WebSocket layer handles the real-time experience; the REST API owns the source of truth.

---

## Presence and Cursors

When a user joins a page room, they broadcast their presence and receive the presence list:

```jsonc
// Client → Server: join page
{ "event": "page:join", "pageId": "clxxx..." }

// Server → all clients in room
{
  "event": "presence:update",
  "users": [
    {
      "userId": "clyyy...",
      "name": "Alice",
      "avatar": "https://...",
      "color": "#7C3AED",        // deterministic per userId
      "cursor": { "blockId": "h1-block", "offset": 14 },
      "selection": { "from": 10, "to": 20 }
    }
  ]
}
```

**Cursor throttle:** cursor/selection updates are throttled to **50 ms** on the client before emitting.

**Heartbeat:** clients send a `ping` every 30 s. If no ping for 45 s, the server removes the user from presence.

---

## Comment Notifications

When a new comment is posted via the REST API (`POST /pages/:pageId/comments`), the API module also publishes to the page room:

```jsonc
// Server → all clients in page room
{
  "event": "comment:created",
  "comment": {
    "id": "clzzz...",
    "content": "Can we simplify this section?",
    "author": { "id": "...", "name": "Bob", "avatar": "..." },
    "pageId": "clxxx...",
    "parentId": null,
    "createdAt": "2026-05-13T10:30:00Z"
  }
}
```

Similarly for `comment:updated`, `comment:deleted`, and `comment:resolved`.

---

## Horizontal Scaling

Without the Redis adapter, Socket.IO rooms are scoped to a single process — users connected to different API instances can't communicate. The **`socket.io-redis`** adapter syncs room membership and broadcasts across all instances via Redis Pub/Sub.

```
Instance 1                   Redis                 Instance 2
    │                          │                       │
    │  publish "page:cxxx"     │                       │
    │  event to channel ──────►│  ──────────────────►  │
    │                          │  receive + forward    │
    │                          │  to local sockets     │
```

Set `REDIS_URL` in your environment to enable this. Without it, the gateway falls back to in-process broadcasting (suitable for development or single-instance deploys).

---

## Client Integration

```typescript
// hooks/useRealtimePage.ts (example)
import { useEffect } from 'react';
import { socket } from '@/lib/socket';

export function useRealtimePage(pageId: string) {
  useEffect(() => {
    socket.emit('page:join', { pageId });

    socket.on('doc:op', (op) => {
      // apply incoming operation to local TipTap editor
    });

    socket.on('presence:update', (users) => {
      // update cursor overlays
    });

    return () => {
      socket.emit('page:leave', { pageId });
      socket.off('doc:op');
      socket.off('presence:update');
    };
  }, [pageId]);
}
```

---

## Events Reference

### Client → Server

| Event          | Payload                                    | Description                        |
|---------------|--------------------------------------------|------------------------------------|
| `page:join`   | `{ pageId }`                               | Join a page room                   |
| `page:leave`  | `{ pageId }`                               | Leave a page room                  |
| `doc:op`      | `{ pageId, op, baseVersion }`              | Submit an OT operation             |
| `cursor:move` | `{ pageId, blockId, offset, selection? }`  | Broadcast cursor position          |
| `ping`        | —                                          | Heartbeat keepalive                |

### Server → Client

| Event              | Payload                                  | Description                          |
|-------------------|------------------------------------------|--------------------------------------|
| `doc:op`          | `{ op, version, userId }`               | Broadcast transformed op             |
| `doc:ack`         | `{ version }`                           | Confirm op applied                   |
| `presence:update` | `{ users[] }`                           | Full presence list for the room      |
| `cursor:update`   | `{ userId, blockId, offset, selection }`| Single user cursor update            |
| `comment:created` | `{ comment }`                           | New comment on the page              |
| `comment:updated` | `{ comment }`                           | Comment edited                       |
| `comment:deleted` | `{ commentId }`                         | Comment deleted                      |
| `comment:resolved`| `{ commentId, resolved }`              | Thread resolved / unresolved         |
| `page:updated`    | `{ pageId, changes }`                   | Metadata change (title, icon, etc.)  |
| `tree:updated`    | `{ workspaceId, event, page }`          | Page tree mutation (workspace room)  |
| `error`           | `{ code, message }`                     | Protocol-level error                 |
