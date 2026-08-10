# Flip7 Solver

Flip7 Solver is a probability-focused strategy assistant for Flip 7. It tracks the full visible board state, keeps an exact count of remaining cards, and uses that state to estimate whether the current player should draw or quit.

The main purpose of the project is the solver: a TypeScript rules and expected-value engine that can reason about the active player, their current cards, the remaining deck, bust risk, and score outcomes. The React interface exists to make that board state easy to enter and inspect during a real game.

<p>
  <a href="https://flip7solver.felixjahr.com">Live Website</a>
</p>

## Solver

- **Board-state input** receives all players, their cards, the active player, discarded cards, and any active Flip Three sequence.
- **Bust percentage** counts remaining cards that would bust the active player and divides them by the current draw pile size.
- **Draw EV** iterates over remaining number and bonus cards, scores each possible outcome, and weights it by remaining card count.
- **Recommendation logic** compares draw EV against the active player's current points and recommends drawing or quitting.
- **Reusable solver entry points** live outside the UI so the strategy engine can grow independently from the interface.

The current expected-value calculation intentionally excludes action cards. That keeps the first version explainable and focused on the core scoring math while leaving a clear path for deeper modeling of Freeze, Flip Three, and Second Chance outcomes.

## Probability Model

```text
Current Board State
  | players, cards, active player, discard pile, Flip Three state
  v
Remaining Deck Counts
  | subtract visible board cards and discarded cards
  v
Outcome Enumeration
  | score every possible drawable number and bonus card
  v
Expected Value
  | weight each outcome by remaining card frequency
  v
Recommendation
  | draw if EV is higher than current points, otherwise quit
```

## Rule Engine

- **Score calculation** sums number cards, applies x2, then applies bonus cards.
- **Duplicate number cards** bust a player unless they have an unused Second Chance.
- **Second Chance** is consumed and discarded when it prevents a bust.
- **Second Chance redirecting** lets a player with an active Second Chance pass a newly drawn Second Chance to another eligible active player.
- **Freeze** targets a player and removes them from the active round.
- **Flip Three** targets a player for three forced draws, then returns the round to the previous turn position.
- **Deferred Flip Three actions** are resolved only if the forced draw sequence ends without a bust or Flip 7.
- **Flip 7** immediately ends the round for active players and awards the 15-point bonus.
- **Deck and discard handling** keeps used cards out of the deck across rounds until the draw pile is empty.

## Gameplay Tracking

- **Player setup** for 3 to 18 players with custom names.
- **Sequential turn entry** so only the next active player's card can be entered.
- **Card availability tracking** with exhausted cards still visible but disabled.
- **Round status tracking** for active, out, frozen, busted, and Flip 7 players.
- **Persistent game totals** across rounds, with each new round starting from the next player.
- **Solver panel** showing draw EV, EV delta, bust risk, and the recommended action.

## Technical Highlights

- **Expected-value solver** built around pure TypeScript functions that receive the full board state.
- **Exact remaining-card accounting** for visible cards, discarded cards, and deck recycling.
- **TypeScript domain model** for players, cards, board state, deferred actions, and solver inputs.
- **Separated rule logic** for scoring, busts, Flip 7 resolution, active-player selection, and discard recycling.
- **React 19 app** built with Vite for fast local development and production builds.
- **Component-based UI** split into setup, header, scoreboard, EV panel, turn controls, and player board views.
- **No backend dependency**; all state and calculations run locally in the browser.

## Architecture

```text
React UI
  | enter observed cards and action targets
  v
App State
  | active player, round state, discarded cards, Flip Three state
  v
Game Rules
  | score cards, consume Second Chance, resolve busts, Freeze, Flip Three, Flip 7
  v
Solver
  | enumerate possible draws and calculate EV from remaining card counts
  v
Recommendation
```

## Repository Structure

```text
.
+-- public/               # Favicon and static public assets
+-- src/
|   +-- components/       # Setup, header, scoreboard, EV panel, turn controls, player board
|   +-- game/             # Cards, types, rules, and solver calculations
|   +-- App.tsx           # Main game orchestration
|   +-- App.css           # App styling
|   +-- main.tsx          # React entry point
+-- index.html            # Vite HTML shell
+-- vite.config.ts        # Vite configuration
```

## Tech Stack

| Area | Technology |
| --- | --- |
| Solver | TypeScript |
| Rule engine | TypeScript |
| Frontend | React |
| Build tool | Vite |
| Styling | CSS |
| Static analysis | ESLint, TypeScript |
| Runtime | Browser-only, local state |

## Features

- Draw EV, bust percentage, and draw-or-quit recommendation.
- Full board-state tracking for every player.
- Remaining-card counts based on visible and discarded cards.
- Turn-by-turn card entry with target selection for action cards.
- Disabled card options when the full card count has been used.
- Current round points and full game points.
- Round completion detection when no player can continue.
- Next-round flow that preserves deck usage correctly.