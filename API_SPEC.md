# Money Guesser API Specification

## OpenAPI Specification (v1)

```yaml
openapi: 3.0.3
info:
  title: Money Guesser API
  version: 1.0.0
  description: REST interface for room management, content authoring, and scoring events.
servers:
  - url: https://api.moneyguesser.app/v1
    description: Production
  - url: https://staging.moneyguesser.app/v1
    description: Staging
tags:
  - name: Rooms
  - name: Items
  - name: Gameplay
paths:
  /rooms:
    post:
      tags: [Rooms]
      summary: Create a new room and host session.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RoomCreateRequest'
      responses:
        '201':
          description: Room created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RoomResponse'
        '400': { $ref: '#/components/responses/BadRequest' }
  /rooms/{roomCode}:
    get:
      tags: [Rooms]
      summary: Retrieve lobby or round status.
      parameters:
        - $ref: '#/components/parameters/RoomCode'
      responses:
        '200':
          description: Room snapshot.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RoomState'
        '404': { $ref: '#/components/responses/NotFound' }
  /rooms/{roomCode}/join:
    post:
      tags: [Rooms]
      summary: Join a room as player.
      parameters:
        - $ref: '#/components/parameters/RoomCode'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JoinRoomRequest'
      responses:
        '200':
          description: Player accepted.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JoinRoomResponse'
        '409': { $ref: '#/components/responses/Conflict' }
        '400': { $ref: '#/components/responses/BadRequest' }
  /rooms/{roomCode}/items:
    post:
      tags: [Items]
      summary: Host registers an item with price and hosted media URL.
      parameters:
        - $ref: '#/components/parameters/RoomCode'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ItemTemplate'
      responses:
        '201':
          description: Item queued for gameplay.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ItemTemplate'
        '403': { $ref: '#/components/responses/Forbidden' }
  /rooms/{roomCode}/start:
    post:
      tags: [Gameplay]
      summary: Host triggers countdown and first round.
      parameters:
        - $ref: '#/components/parameters/RoomCode'
      responses:
        '202': { description: Game starting }
        '409': { $ref: '#/components/responses/Conflict' }
  /rooms/{roomCode}/rounds/{roundId}/guess:
    post:
      tags: [Gameplay]
      summary: Submit or update a player guess.
      parameters:
        - $ref: '#/components/parameters/RoomCode'
        - $ref: '#/components/parameters/RoundId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GuessRequest'
      responses:
        '200': { description: Guess recorded }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /rooms/{roomCode}/leaderboard:
    get:
      tags: [Gameplay]
      summary: Fetch rolling or final leaderboard.
      parameters:
        - $ref: '#/components/parameters/RoomCode'
      responses:
        '200':
          description: Ordered player standings.
          content:
            application/json:
              schema:
                type: object
                properties:
                  roomCode:
                    type: string
                  leaderboard:
                    type: array
                    items:
                      $ref: '#/components/schemas/LeaderboardEntry'
        '404': { $ref: '#/components/responses/NotFound' }
components:
  parameters:
    RoomCode:
      in: path
      name: roomCode
      required: true
      schema:
        type: string
      description: Six-character alphanumeric code.
    RoundId:
      in: path
      name: roundId
      required: true
      schema:
        type: string
  responses:
    BadRequest:
      description: Invalid payload.
    NotFound:
      description: Resource missing.
    Conflict:
      description: Illegal state transition or room is full.
    Forbidden:
      description: Host-only operation.
    UnprocessableEntity:
      description: Guess outside window or malformed.
  schemas:
    RoomCreateRequest:
      type: object
      required: [hostName, roundDurationSeconds, maxPlayers]
      properties:
        hostName:
          type: string
          maxLength: 24
        roundDurationSeconds:
          type: integer
          minimum: 10
          maximum: 120
        maxPlayers:
          type: integer
          minimum: 2
          maximum: 12
    RoomResponse:
      type: object
      properties:
        roomCode:
          type: string
        hostToken:
          type: string
        shareUrl:
          type: string
    RoomState:
      type: object
      properties:
        roomCode:
          type: string
        status:
          type: string
          enum: [lobby, countdown, active, reveal, finished]
        hostName:
          type: string
        roundNumber:
          type: integer
        totalRounds:
          type: integer
        roundDurationSeconds:
          type: integer
        maxPlayers:
          type: integer
        players:
          type: array
          items:
            $ref: '#/components/schemas/Player'
        currentItem:
          allOf:
            - $ref: '#/components/schemas/ItemTemplate'
          description: Hidden price when status != reveal/finished.
    Player:
      type: object
      properties:
        id:
          type: string
          description: Server-generated unique player identifier
        displayName:
          type: string
        avatarColor:
          type: string
          description: Server-assigned hex color for player avatar
        score:
          type: integer
          description: Cumulative score across all rounds
    JoinRoomRequest:
      type: object
      required: [displayName]
      properties:
        displayName:
          type: string
          maxLength: 24
    JoinRoomResponse:
      type: object
      properties:
        playerToken:
          type: string
        player:
          $ref: '#/components/schemas/Player'
    ItemTemplate:
      type: object
      required: [imageUrl, priceCents, label]
      properties:
        id:
          type: string
          description: Server-generated unique identifier (returned in responses)
        label:
          type: string
        imageUrl:
          type: string
          format: uri
        priceCents:
          type: integer
          minimum: 0
    GuessRequest:
      type: object
      required: [playerToken, priceCents]
      properties:
        playerToken:
          type: string
        priceCents:
          type: integer
          minimum: 0
    LeaderboardEntry:
      type: object
      properties:
        playerId:
          type: string
        displayName:
          type: string
        score:
          type: integer
        rank:
          type: integer
```

## Realtime Gateway
- WebSocket endpoint: `wss://api.moneyguesser.app/ws/rooms/{roomCode}?token=<playerToken|hostToken>`.
- Core events:
  - `room.updated`: Payload is `RoomState`
  - `round.started`: Payload includes `{ roundNumber, itemId, itemLabel, imageUrl, durationSeconds }`
  - `round.countdown`: Payload includes `{ roundNumber, remainingSeconds }`
  - `guess.ack`: Confirms guess submission `{ playerId, roundNumber }`
  - `round.reveal`: Payload includes `{ roundNumber, correctPriceCents, leaderboard }`
  - `game.finished`: Payload includes `{ finalLeaderboard, winner }`
  - `player.joined`: Payload includes `Player` object
  - `player.left`: Payload includes `{ playerId, displayName }`
  - `error`: Payload includes `{ code, message }`
- Host-only events: `item.added`, `game.canceled`.
- Scoring formula: `points = max(0, 1000 - Math.floor(Math.abs(guessCents - actualCents) / 10))`
