# Shared Workspace

This package is the home for code shared across web, mobile, and backend surfaces.

Current shared modules:

- `src/chat.d.ts` for message, room, and language domain types
- `src/socket.d.ts` for Socket.IO contracts used by web, mobile, and API

Good candidates to move here next:

- auth request and response models
- room list and room details DTOs
- Zod schemas that both clients can reuse
