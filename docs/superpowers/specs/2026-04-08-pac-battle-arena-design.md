# PAC BATTLE ARENA — Design Specification

## Overview

A multiplayer Pac-Man style arena game for TikTok Live. Players join from TikTok Live and interact in real time via gifts, likes, and comments. The game runs as an OBS browser source in 1:1 square format (1080x1080).

**TikTok Username:** playandwin2026
**Language:** German (all UI text in German)

---

## 1. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | PixiJS (WebGL) |
| Backend | Node.js + Express |
| Real-time | WebSocket (ws) |
| TikTok | tiktok-live-connector |
| Format | 1080x1080 square, OBS browser source |

**Architecture:** Server-authoritative. Server runs all game logic (movement, collision, combat, scoring). Client is a dumb renderer — receives state via WebSocket at 30fps and draws it with PixiJS.

---

## 2. Project Structure

```
pac-battle-arena/
├── server/
│   ├── index.js              # Express + WebSocket server entry
│   ├── Game.js               # Main game loop (tick 30fps)
│   ├── Arena.js              # Entity management, spawning, collision
│   ├── PacMan.js             # Pac-Man entity (AI + player)
│   ├── CombatSystem.js       # Combat resolution on collision
│   ├── TeamManager.js        # Blue/Pink teams, scores
│   ├── RoundManager.js       # 15-min timer, winners, trophies
│   ├── GiftSystem.js         # Gift effects (Rose through Fire Truck)
│   ├── GrowthSystem.js       # Size/speed/spin scaling
│   ├── CoinSystem.js         # Coin spawning, collection, respawn
│   ├── SoundManager.js       # Web Audio API sound effects
│   ├── WinTracker.js         # Session win tracking across rounds
│   └── tiktok/
│       ├── TikTokBridge.js   # tiktok-live-connector wrapper
│       └── GiftMapper.js     # Map TikTok gift IDs to game actions
├── client/
│   ├── index.html            # 1080x1080 canvas page
│   ├── app.js                # PixiJS app init + WebSocket client
│   ├── renderers/
│   │   ├── ArenaRenderer.js  # Background image, ambient effects
│   │   ├── PacManRenderer.js # Pac-Man drawing, mouth animation, profile pics
│   │   ├── HUDRenderer.js    # Team scores, timer, king, leaderboard
│   │   ├── CoinRenderer.js   # Coin dots, sparkle effects on pickup
│   │   ├── EffectRenderer.js # Gift effects, glow, particles, freeze, fire
│   │   └── WinScreen.js      # Round end celebration, trophies, confetti
│   └── assets/
│       ├── bg.jpeg           # Background image (provided by client)
│       ├── Team Girl.jpeg    # Rose gift image for Pink team
│       ├── Team Men.jpeg     # TikTok gift image for Blue team
│       └── (crown sprite, fonts)
├── package.json
├── .gitignore
└── README.md
```

---

## 3. Visual Design

**Background:** Client-provided neon maze arena image (bg.jpeg). Used as full-screen background, game entities render on top.

**Arena style:** Open arena — no collision with background walls. Pac-Mans move freely in all directions over the background image. The maze in the background is purely decorative.

**Screen layout:** Full screen + HUD overlay. Arena takes 100% of 1080x1080. All UI floats on top with semi-transparent backgrounds.

**Pac-Man characters:** Classic Pac-Man shape with team-colored glowing outline. Player profile picture visible inside the Pac-Man body. Eye on top. Animated mouth (open/close) — speed tied to activity/gifts.

**Color coding:**
- Neutral players: Red
- Blue team: Blue (#4488ff)
- Pink team: Pink (#ff69b4)
- Gift colors: Pink (Rose), Yellow (Donut), Rainbow (Confetti), Gold (Money Gun), Red-orange fire (Fire Truck)

---

## 4. Player States

### State 1 — Neutral (RED)
- **Trigger:** Any user enters the live (like, comment, or gift)
- **Color:** Red
- **Text above:** "Choose a team"
- **Movement:** Slow wandering
- **Mouth animation:** None
- **Combat:** Cannot attack. Can be attacked.
- **Points:** Cannot gain points. Starts with 500.

### State 2 — Active Team Player
- **Trigger:** Sends Rose (→ Pink team) or TikTok gift (→ Blue team), or recently sent a like/gift
- **Color:** Team color (blue or pink)
- **Text above:** Username + points (no "Choose a team")
- **Movement:** Full speed
- **Mouth animation:** Active (speed based on activity/gifts)
- **Combat:** Can attack inactive players. Can gain points.

### State 3 — Inactive Team Player
- **Trigger:** Team player who hasn't sent a like or gift recently
- **Color:** Team color (dimmed)
- **Movement:** Slow
- **Mouth animation:** Reduced
- **Combat:** Cannot attack. Can be attacked.
- **Reactivation:** Any like or gift makes them active again

---

## 5. Team System

**Two teams:**
- **Pink team (Girls):** Join by sending Rose gift (1 coin)
- **Blue team (Men):** Join by sending TikTok gift (1 coin)

**Team scores:**
- Pink total = sum of all pink Pac-Man points (players + AI)
- Blue total = sum of all blue Pac-Man points (players + AI)
- Updated every tick, always visible on HUD

**Team images:** Client provided Rose image (Pink team) and TikTok logo (Blue team) for HUD display.

---

## 6. AI System

**Always 20 AI Pac-Mans in the arena:**

**10 Inactive AI:**
- Slow floating/wandering movement
- No mouth animation
- Cannot attack
- Can always be attacked (point farms for players)
- Split: 5 blue, 5 pink

**10 Active AI:**
- Simulate Rose behavior (move actively, mouth animation)
- Can attack inactive players (+5 pts per hit)
- Gain points through combat
- Split: 5 blue, 5 pink

**Respawn:**
- AI reaches 0 points → immediately respawn new AI at random position with 500 points
- Always maintain 20 AI minimum
- Players spawn alongside AI (arena can exceed 20 total entities)

---

## 7. Combat System

**Core rule:** Active players can attack inactive players. On collision, inactive loses points.

**Base combat (no gift active):**
- Active hits inactive → inactive loses 5 points

**Gift-enhanced combat:**

| Gift | Points Per Hit | Can Hit |
|---|---|---|
| Rose (1 coin) | 5 pts | Inactive players only |
| Donut (30 coins) | 10 pts | Players without active gift protection |
| Confetti (100 coins) | 20 pts | Inactive players only |
| Money Gun (500 coins) | +50 from every player (instant) | All players (they're frozen) |
| Fire Truck (ultimate) | 100 pts per hit | All players (active + inactive) |

**Collision mechanics:**
- Circle-based collision detection (Pac-Man radius)
- Hit cooldown: 0.5 seconds between hits on same target
- Small knockback on hit

**Balance:**
- Big = strong (faster, farms faster) but easy target (larger hitbox)
- Small = weak (slower) but harder to hit (smaller hitbox)

**Elimination:**
- Points reach 0 → eliminated
- AI: immediately respawn as new AI
- Player: respawn as neutral RED ("Choose a team")

---

## 8. Gift System

### General Rules
- All gifts last exactly **3 seconds**
- Only exception: Fire Truck = **5 seconds**
- Duration does NOT change — only power increases per tier
- Each gift has a unique color (active only during effect)
- Higher gift = faster movement, faster spin, more points per hit
- Each gift must feel clearly stronger than the previous
- Gift overlap: higher tier always takes priority

### Gift 1 — Rose (1 coin)
- **Color:** Pink glow (subtle)
- **Effect:** Activates player, enables spin/mouth animation
- **Speed boost:** Very minimal and very short (~1 second, barely noticeable). Just enough to "wake up" the player. Much weaker than all other gifts.
- **Combat:** +5 pts per hit on inactive players
- **Special:** Also serves as Pink team join gift
- **Duration:** 3 seconds (but speed effect fades after ~1 sec, only activation + combat stays)

### Gift 2 — Donut (30 coins)
- **Color:** Yellow
- **Effect:** Faster spin, faster movement
- **Combat:** +10 pts per hit on unprotected players (anyone without active gift)
- **Duration:** 3 seconds

### Gift 3 — Confetti (100 coins)
- **Color:** Rainbow/multicolor shimmer
- **Effect:** Stronger speed, stronger spin
- **Combat:** +20 pts per hit on inactive players
- **Duration:** 3 seconds

### Gift 4 — Money Gun (500 coins)
- **Color:** Gold
- **Effect:** ALL other players freeze (stop moving). Only this player can move.
- **Combat:** +50 pts from EVERY player on the map (instant transfer)
- **Animation:** Points/coins visually fly from all players toward this player
- **Duration:** 3 seconds

### Gift 5 — Fire Truck (Ultimate)
- **Color:** Red/orange fire glow
- **Effect:** Explosion on activation. Player becomes very large. Very fast movement. Very fast spin.
- **Combat:** +100 pts per hit on ALL players (active + inactive)
- **Visual:** Fire particles, intense glow, strong particle effects
- **Duration:** 5 seconds

---

## 9. Growth & Speed Scaling

**Continuous growth — no levels, no cap.**

**Size scaling:**
- Base size: 25px (at 0 points)
- +1px per 25 points
- 500 pts (start) → ~45px
- 2000 pts → ~105px
- 5000 pts → ~225px
- No upper limit

**Speed scaling:**
- Bigger = faster movement
- Bigger = faster mouth animation/spin
- Formula: `speed = baseSpeed + (size * speedFactor)`

**Balance:** Size is both advantage and disadvantage. Bigger players move faster and farm faster, but present a larger hitbox that multiple smaller players can hit.

---

## 10. Like System

- Sending a like **activates** the player (transitions from inactive to active)
- Small speed increase
- Boosts activity score (prevents becoming inactive)
- No direct point gain from likes

---

## 11. Round System

**Round duration:** ~15 minutes (countdown timer)

**During round:**
- HUD displays: team scores, top 3 players, king crown on #1 player
- Timer always visible

**End of round:**
- Game pauses
- Display winning team (higher total points)
- Display top 3 players with points
- Celebration animation: confetti particles, highlight effects
- Top player gets "King" status with crown

**Result screen:** Shown for ~10 seconds

**Reset:**
- All players respawn with 500 points as neutral RED
- 20 new AI spawn
- New round begins
- King status carries over visually

---

## 12. HUD / UI Overlay

All UI floats on the game arena with semi-transparent backgrounds.

**Top bar:**
```
[🌹 PINK: 12,450]     [ROUND 1 — 12:34]     [🎵 BLUE: 11,890]
```

**Top-left:**
```
👑 King: PlayerName (2,100 pts)
```

**Top-right or bottom:**
```
🥇 Player1: 2,100
🥈 Player2: 1,800
🥉 Player3: 1,500
```

**Above neutral players:**
```
"Wähle ein Team"
```

**Above team players:**
```
Username (Punkte)
```

---

## 13. Game Loop (Server)

Runs at 30 ticks per second (33ms per tick):

```
1. Process TikTok events queue (gifts, likes, joins)
2. Update AI movement (wander, chase, flee)
3. Update player Pac-Man movement
4. Apply active gift effects (speed, freeze, fire truck)
5. Check collisions between all Pac-Mans
6. Resolve combat (check states, apply damage)
7. Update growth (size/speed recalculation)
8. Check activity decay (active → inactive transition)
9. Check eliminations and respawns
10. Update king status (highest points)
11. Update team scores
12. Check round timer
13. Broadcast full game state to client via WebSocket
```

---

## 14. PacMan Entity Properties

```javascript
{
  id: string,              // Unique identifier
  type: "ai" | "player",  // Entity type
  state: "neutral" | "active" | "inactive",  // Current state
  team: null | "blue" | "pink",  // null = neutral/red
  username: string,        // TikTok username or AI name
  avatarUrl: string,       // TikTok profile picture URL
  x: number,              // Position (0-1080)
  y: number,              // Position (0-1080)
  angle: number,          // Movement direction (radians)
  points: number,         // Current score (starts at 500)
  size: number,           // Calculated from points
  speed: number,          // Calculated from size
  mouthAngle: number,     // Current mouth openness (0-45 degrees)
  mouthSpeed: number,     // Animation speed (tied to state/gifts)
  activeGift: null | {    // Currently active gift effect
    type: string,         // "rose" | "donut" | "confetti" | "moneygun" | "firetruck"
    remainingMs: number,  // Time remaining
    color: string         // Effect color
  },
  isKing: boolean,        // Highest points player
  lastActivityTime: number // Timestamp of last like/gift (for inactive detection)
}
```

---

## 15. WebSocket Protocol

**Server → Client (30fps):**
```javascript
{
  type: "gameState",
  entities: [ /* array of PacMan objects */ ],
  teams: { blue: { score, playerCount }, pink: { score, playerCount } },
  top3: [ { username, points, avatarUrl } ],
  king: { username, points, avatarUrl },
  round: { number, remainingSeconds, totalSeconds },
  events: [ /* active visual events: freeze, explosion, coin animations */ ]
}
```

**Server → Client (on round end):**
```javascript
{
  type: "roundEnd",
  winningTeam: "blue" | "pink",
  teamScores: { blue: number, pink: number },
  top3: [ { username, points, avatarUrl, trophy: "gold" | "silver" | "bronze" } ],
  king: { username, points, avatarUrl }
}
```

---

## 16. TikTok Gift Mapping

Gift IDs must be configured in `GiftMapper.js`. Client will provide exact TikTok gift IDs for:

| Game Action | TikTok Gift | Coins |
|---|---|---|
| Join Pink Team | Rose | 1 |
| Join Blue Team | TikTok (logo gift) | 1 |
| Gift 1 power-up | Rose | 1 |
| Gift 2 power-up | Donut | 30 |
| Gift 3 power-up | Confetti | 100 |
| Gift 4 power-up | Money Gun | 500 |
| Gift 5 power-up | Fire Truck | TBD (client to confirm coin value) |

**Note:** Rose serves double duty — first Rose = join Pink team + activate. Subsequent Roses = gift power-up effect.

---

## 17. Sound Effects

Minimal, clean sound design using Web Audio API (generated tones, no heavy audio files).

**Triggers:**
- Gift sent: soft chime/ping (pitch increases with gift tier)
- Points gained on hit: quick satisfying pop
- Money Gun activation: cash register / coin shower sound
- Fire Truck activation: explosion boom
- Freeze (Money Gun): ice/crystal sound
- Round end / winner: victory fanfare (short)
- King crown transfer: royal horn (subtle)

**Rules:**
- Keep it minimal and satisfying, not annoying
- Not too loud — TikTok Live has its own audio stream
- No background music (would conflict with streamer's music)
- All sounds generated via Web Audio API (no external audio files needed)

---

## 18. Coin Pickup System

**Coins scattered on the arena floor for players to collect.**

**Spawning:**
- 20-30 coins placed randomly across the arena at round start
- Coins are small glowing dots/circles matching the neon aesthetic
- Different coin types possible:
  - Regular coin: +5 points (common, small, white/yellow glow)
  - Big coin: +15 points (rare, larger, golden glow)

**Collection:**
- ONLY active players and active AI can collect coins
- Inactive players, inactive AI, and neutral (red) players CANNOT collect coins
- Coins pass through inactive/neutral players with no effect
- Coin disappears on contact with a small sparkle effect
- Points added to the collector

**Respawn:**
- When all coins are collected → new batch spawns after 5 seconds
- Also: partial respawn every 30 seconds (refill back to 20-30 coins)
- Coins never fully run out — always something to collect

**Why this works:**
- Adds constant movement incentive (even without combat)
- Rewards active players — another reason to send gifts/likes
- Classic Pac-Man dot-eating feel
- More visual activity on screen (glowing coins everywhere)

---

## 19. Assumptions (Safe Defaults)

These items were not explicitly specified by the client. Safe defaults chosen, easy to change:

1. **Hit cooldown:** 0.5 seconds between hits on same target
2. **Knockback:** Small push on hit
3. **Player at 0 points:** Respawn as neutral RED
4. **Inactive timeout:** Player becomes inactive after ~15 seconds without like/gift
5. **Confetti color:** Rainbow/multicolor
6. **Result screen duration:** 10 seconds before reset
7. **Fire Truck coin value:** To be confirmed by client
8. **King crown persists:** Crown visible throughout round, transfers in real-time
