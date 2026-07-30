# Riftbound Online

A modern web application for building, sharing, and playing **Riftbound** decks online.

Riftbound Online combines a deck builder, community deck browser, and multiplayer tabletop simulator into a single platform. The application allows players to create decks, discover community creations, and play synchronized online matches with friends.

> **Note**
> This project is **not** a rules engine like MTG Arena. Players are responsible for following the rules of Riftbound, while the server synchronizes the shared game state between all participants.

---

# Features

## Deck Builder

- Search the complete Riftbound card database
- Build legal Riftbound decks
- Automatic deck validation
- Save multiple decks
- Edit existing decks
- Delete decks

---

## Community Decks

- Share decks publicly
- Browse community-created decks
- Copy public decks into your account
- Filter and search community decks

---

## Multiplayer

- Create game lobbies
- Join existing lobbies
- 2–4 player support
- Invite players via lobby code or URL
- Real-time synchronized gameplay
- Automatic reconnection

---

## Authentication

- User registration
- Login/logout
- Secure session management
- Protected user content

---

# Project Structure

```
.
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── auth/
│   │   ├── cards/
│   │   ├── decks/
│   │   ├── matches/
│   │   ├── websocket/
│   │   └── middleware/
│   └── package.json
│
├── onn-web/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── package.json
│
└── README.md
```

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- HeroUI
- Tailwind CSS

---

## Backend

- Express.js
- Prisma ORM
- PostgreSQL
- WebSockets
- TypeScript

---

# Architecture

```
                +----------------------+
                |      Frontend        |
                |     Next.js App      |
                +----------+-----------+
                           |
                    REST API / WebSocket
                           |
                +----------v-----------+
                |       Backend        |
                | Express + WebSocket  |
                +----------+-----------+
                           |
                     Prisma ORM
                           |
                +----------v-----------+
                |     PostgreSQL       |
                +----------------------+
```

---

# Gameplay Model

Unlike fully automated digital card games, Riftbound Online is designed as a **digital tabletop simulator**.

The server is responsible for:

- Authenticating users
- Managing decks
- Managing lobbies
- Synchronizing game state
- Broadcasting player actions
- Persisting match state

The server **does not**:

- Enforce Riftbound rules
- Validate card effects
- Enforce resource costs
- Resolve combat
- Prevent illegal moves

Players are expected to follow the official Riftbound rules during gameplay.

---

# MVP Roadmap

## ✅ Phase 1

Authentication

- Register
- Login
- Logout
- Session management

Deck Builder

- Save decks
- Edit decks
- Delete decks
- Deck validation

---

## 🚧 Phase 2

Community Decks

- Public/private decks
- Community browser
- Deck copying

---

## 🚧 Phase 3

Lobby System

- Create lobby
- Join lobby
- Leave lobby
- Ready system
- Match start
- 2–4 player support

---

## 🚧 Phase 4

Online Gameplay

- Real-time synchronization
- Shared board state
- Turn tracking
- Phase tracking
- Reconnect support

---

## 🚧 Phase 5

Production

- Deployment
- Monitoring
- Logging
- Performance optimization

---

# Backend API

## Authentication

```
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

## Cards

```
GET /cards
GET /cards/:id
GET /cards/search
```

---

## Decks

```
GET    /decks
GET    /decks/my
GET    /decks/community
GET    /decks/:id

POST   /decks
PUT    /decks/:id
DELETE /decks/:id

PATCH  /decks/:id/share
POST   /decks/:id/copy
```

---

## Matches

```
POST   /matches

GET    /matches
GET    /matches/:id

POST   /matches/:id/join
POST   /matches/:id/leave

POST   /matches/:id/ready
POST   /matches/:id/unready

POST   /matches/:id/start

GET    /matches/active
```

---

# WebSocket Events

## Client → Server

```
join_match
leave_match

move_card
draw_card
shuffle_deck

update_counter

update_turn
update_phase

create_token
remove_token

sync_state

heartbeat
```

---

## Server → Client

```
player_joined
player_left

player_ready

match_started

state_updated

turn_changed

phase_changed

player_disconnected
player_reconnected

match_finished
```

---

# Local Development

## Requirements

- Node.js 22+
- PostgreSQL
- npm (or pnpm)

---

## Clone the Repository

```bash
git clone https://github.com/<username>/riftbound-online.git

cd riftbound-online
```

---

## Backend

```bash
cd backend

npm install

npx prisma generate

npx prisma migrate dev

npm run dev
```

Backend runs on:

```
http://localhost:3001
```

---

## Frontend

```bash
cd onn-web

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

# Environment Variables

Backend

```env
DATABASE_URL=
JWT_SECRET=
SESSION_SECRET=

CLIENT_URL=

PORT=3001
```

Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

# Development Guidelines

- Use TypeScript everywhere.
- Keep controllers thin.
- Put business logic in services.
- Use Prisma for all database access.
- Validate all external input.
- Keep React components focused and reusable.
- Follow the API contracts defined in `AGENTS.md`.

---

# Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run linting and tests.
5. Open a pull request.

Before submitting a PR, ensure:

- TypeScript passes
- ESLint passes
- Project builds successfully
- New functionality includes tests where appropriate

---

# Future Features

- Ranked matchmaking
- Tournament support
- Friends system
- Spectator mode
- Replay viewer
- Match history
- Deck ratings
- Deck comments
- AI opponents
- Mobile support

---

# License

This project is currently intended for personal and educational use. Licensing may change as the project evolves.

---

# Disclaimer
ONN is an unofficial fan-made project and is not affiliated with, endorsed by, or sponsored by Riot Games. Riftbound and all related intellectual property belong to their respective owners.
