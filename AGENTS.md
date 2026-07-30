# AGENTS.md

# Riftbound Online

Development guide for AI coding agents working on Riftbound Online.

---

# Project Vision

Riftbound Online is a full-stack web application for playing Riftbound online.

Players can:

- Register and log in
- Build and save decks
- Share decks with the community
- Browse and copy public decks
- Create multiplayer lobbies
- Join multiplayer games
- Play Riftbound online with synchronized board states

The project is split into two applications:

```
backend/    Express + Prisma + WebSockets
onn-web/    Next.js + React + HeroUI
```

---

# MVP Goals

The MVP is complete when users can:

- Create an account
- Login/logout
- Build legal Riftbound decks
- Save decks
- Edit decks
- Delete decks
- Share decks publicly
- Browse community decks
- Copy public decks
- Create multiplayer lobbies
- Join lobbies
- Ready up
- Start games with 2–4 players
- Play a synchronized online game
- Reconnect after disconnecting


---

# Current Development Priorities

## Milestone 1

Complete API contracts.

Backend

- Add `/auth/me`
- Persist deck cards correctly
- Community deck endpoint
- Copy deck endpoint
- Include owner metadata
- Include card counts
- Server-side deck legality validation

Acceptance

- Frontend no longer requires mocked APIs
- Deck CRUD fully functional

---

## Milestone 2

Deck sharing.

Backend

- Public/private decks
- Community query
- My decks query
- Copy public deck

Frontend

- Share button
- Unshare button
- Community browser
- Ownership badges
- Visibility indicators

Acceptance

- Public decks discoverable
- Private decks inaccessible
- Public decks copyable

---

## Milestone 3

Lobby system.

Backend

- Create lobby
- Join lobby
- Leave lobby
- Ready
- Unready
- Start game

Rules

- 2–4 players
- Maximum player enforcement
- Host starts game
- Everyone must be ready

Frontend

- Lobby page
- Player list
- Invite link
- Ready button
- Start button
- Active matches

Acceptance

- 2-player games
- 3-player games
- 4-player games

---

## Milestone 4

Realtime synchronization.

Implement WebSockets.

Synchronize

- Player joins
- Player leaves
- Board state
- Turn changes
- Phase changes
- Counters
- Zones
- Card movement

Acceptance

- All connected players remain synchronized.

---

## Milestone 5

Gameplay interface.

Display

- Hand
- Deck
- Battlefield
- Graveyard
- Champion
- Legend
- Rune area

UI

- Turn indicator
- Phase indicator
- Action history
- Connection status
- Sync status

Acceptance

- Full game playable online.

---

## Milestone 6

Production deployment.

Deployment

- Production database
- Environment variables
- HTTPS
- Secure cookies
- CORS

Reliability

- Reconnect support
- Lobby cleanup
- Match cleanup

Security

- Authentication
- Authorization
- Input validation

Monitoring

- Health endpoint
- Logging
- Error tracking

---

# Architecture

## Backend

Responsibilities

- Authentication
- Authorization
- Deck storage
- Lobby management
- Match management
- State synchronization
- WebSocket broadcasting
- Persistent game state

The backend **does not enforce Riftbound game rules**.

It only verifies:

- User authentication
- Match membership
- Valid request structure
- Resource ownership

Players are responsible for following Riftbound rules, similar to tabletop play.

---

## Frontend

Responsibilities

- User interface
- Deck builder
- Lobby interface
- Match interface
- Rendering board state
- Sending player actions
- Receiving synchronized updates

---

# Game Synchronization Model

The server stores the shared game state.

The server synchronizes:

- Card locations
- Turn order
- Current phase
- Counters
- Tokens
- Match metadata

The server **does not** determine whether an action is legal.

Clients submit state-changing actions.

The server:

1. Verifies the player belongs to the match.
2. Records the action.
3. Updates the stored game state.
4. Broadcasts the update to every connected player.

This architecture intentionally behaves like a digital tabletop rather than a fully automated game engine.

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

Deck responses should include

- Owner
- Visibility
- Card count
- Legality
- Last updated

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

Client → Server

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

Server → Client

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

# Database Models

## Existing

- User
- Card
- Deck
- DeckCard

## New

### Match

```
id
hostId
status
visibility
format
maxPlayers
joinCode
createdAt
updatedAt
```

---

### MatchPlayer

```
matchId
userId
deckId

seat

ready

active

eliminated
```

---

### MatchState

```
matchId

currentTurn

currentPhase

activePlayer

serializedState
```

---

### MatchEvent

```
id

matchId

playerId

action

payload

timestamp
```

---

# Authorization Rules

## Decks

Owner may

- Read
- Edit
- Delete
- Share

Public decks

- Read
- Copy

Private decks

- Owner only

---

## Matches

Participants may

- View state
- Submit actions

Host may

- Start match

Non-participants

- No access

---

# Testing

Backend

- Authentication
- Authorization
- Deck CRUD
- Deck sharing
- Deck copying
- Lobby lifecycle
- WebSocket synchronization
- State persistence

Frontend

- Authentication flow
- Deck builder
- Community decks
- Lobby flow
- Match synchronization
- Reconnect handling

Integration

- Multi-client synchronization
- Simultaneous actions
- Reconnect recovery
- State consistency

CI

Every pull request must pass

```
lint

typecheck

build

tests
```

---

# Coding Standards

General

- TypeScript everywhere
- Strict typing
- No `any`
- Async/await
- ESLint clean
- Prettier formatted

Backend

- Controllers stay thin
- Business logic belongs in services
- Prisma access isolated to repositories/services
- Validate all inputs
- Never trust client input

Frontend

- Functional React components
- Reusable HeroUI components
- TailwindCSS utilities
- Shared hooks where appropriate
- Keep components small and composable

---

# Definition of Done

A feature is complete only when:

- Backend implemented
- Frontend integrated
- API documented
- Authorization enforced
- Tests added
- TypeScript passes
- Lint passes
- Build succeeds
- Acceptance criteria met

---

# Future Features

After MVP

- Tournament support
- Spectator mode
- Chat
- Deck comments
- Deck ratings
- Match history
- Statistics
