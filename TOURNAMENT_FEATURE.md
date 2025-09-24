# Tournament System Feature

This document outlines the tournament system feature added to the Tic-Tac-Toe game, enabling multi-player tournaments with automatic bracket management.

## Overview

The tournament system allows players to create and participate in structured tournaments where multiple players compete in individual tic-tac-toe matches. Each tournament generates multiple simultaneous games, with each game winner receiving the individual game prize.

## Key Features

### 1. Tournament Creation
- **Creator Role**: Any player can create a tournament by setting entry fee and maximum players
- **Tournament Sizes**: Supports 4, 8, and 16 player tournaments
- **Entry Fee**: Customizable STX amount that players must pay to join
- **Prize Pool**: Automatically calculated based on entry fees (entry fee × max players)

### 2. Tournament Management
- **Registration Phase**: Players can join tournaments during the "OPEN" status
- **Creator Controls**: Tournament creator can start the tournament once it's full
- **Automatic Game Generation**: When started, the system automatically creates multiple games pairing tournament participants

### 3. Tournament Lifecycle
- **OPEN**: Registration phase where players can join
- **IN_PROGRESS**: Games are active and being played
- **COMPLETED**: All tournament games are finished

### 4. Game Integration
- **Tournament Games**: Games created through tournaments are linked via `tournament-id`
- **Prize Distribution**: Each game winner receives the entry fee amount for their specific match
- **Individual Prizes**: Unlike traditional brackets, each game has its own prize (no single tournament winner)

## Smart Contract Changes

### New Contract: tic-tac-toe-v2
The tournament feature required updating the contract to `tic-tac-toe-v2` with the following additions:

#### Tournament Data Structure
```clarity
{
  creator: principal,
  entry-fee: uint,
  max-players: uint,
  current-players: uint,
  status: uint, ; 0=OPEN, 1=IN_PROGRESS, 2=COMPLETED
  winner: (optional principal),
  prize-pool: uint,
  created-at: uint
}
```

#### Game Data Structure Updates
- Added `tournament-id: (optional uint)` to link games to tournaments

#### New Functions
- `create-tournament(entry-fee, max-players)`
- `join-tournament(tournament-id)`
- `start-tournament(tournament-id)`
- `get-tournament(tournament-id)`
- `get-tournament-participant(tournament-id, slot)`
- `get-latest-tournament-id()`

## Frontend Implementation

### New Pages
1. **`/tournaments`** - Main tournaments page showing all tournaments
2. **`/tournament/[id]`** - Individual tournament view with games list

### New Components
1. **`create-tournament.tsx`** - Tournament creation form
2. **`tournament-card.tsx`** - Individual tournament display card
3. **`tournaments-list.tsx`** - Grid of tournament cards
4. **`network-context.tsx`** - Network state management

### Enhanced Components
- **`navbar.tsx`** - Added "Tournaments" navigation link
- **`games-list.tsx`** - Added tournament badges for tournament games
- **`play-game.tsx`** - Added tournament context display and navigation
- **`game-board.tsx`** - Enhanced with win highlighting and better UX

### Updated Contract Integration
- **`contract.ts`** - Added all tournament-related functions and types
- **`use-stacks.ts`** - Enhanced with network context support
- **`stx-utils.ts`** - Added network parameter support

## User Experience Flow

### Creating a Tournament
1. Connected user navigates to Tournaments page
2. Fills out tournament creation form (entry fee, max players)
3. Confirms transaction to create tournament and pay entry fee
4. Tournament appears in "OPEN" status waiting for other players

### Joining a Tournament
1. User browses available tournaments in "Registration Open" status
2. Clicks "Join Tournament" on a tournament card
3. Confirms transaction to pay entry fee
4. User added to tournament participants list

### Starting a Tournament
1. Tournament creator waits for tournament to fill to max capacity
2. "Start Tournament" button becomes available for creator only
3. Creator starts tournament, triggering automatic game generation
4. Tournament status changes to "IN_PROGRESS"

### Playing Tournament Games
1. Players navigate to individual tournament games
2. Tournament context is clearly displayed in game interface
3. Breadcrumb navigation helps users track tournament → game relationship
4. Winners receive entry fee amount for each game won

## Technical Details

### Game Generation Logic
When a tournament starts, the system:
1. Retrieves all tournament participants
2. Creates individual games pairing participants
3. Each game is linked to the tournament via `tournament-id`
4. All games use the tournament entry fee as the bet amount

### Prize Distribution
- **Individual Game Prizes**: Each game winner gets the entry fee amount
- **No Overall Tournament Winner**: Unlike traditional tournaments, there's no single champion
- **Multi-Game Format**: Players may participate in multiple games within one tournament

### Network Support
- **Testnet Only**: Tournament contracts deployed on Stacks testnet
- **Dynamic Network Handling**: Frontend adapts to different network configurations
- **Environment Variables**: Contract addresses configurable via env vars

## Testing

### Contract Tests (Vitest)
- Tournament creation validation
- Player registration and limits
- Tournament lifecycle management
- Game generation on tournament start
- Error handling for invalid operations

### Test Coverage
- ✅ Tournament creation with valid parameters
- ✅ Tournament size restrictions (4, 8, 16 only)
- ✅ Entry fee validation
- ✅ Player registration limits
- ✅ Duplicate registration prevention
- ✅ Creator-only tournament start
- ✅ Automatic game generation
- ✅ Tournament status transitions

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=STZ5Q1C2GVSMCWS9NWVDEKHNW04THC75SEGDHS74
NEXT_PUBLIC_CONTRACT_NAME=tic-tac-toe-v2
```

### Deployment
- Contract deployed via Clarinet to Stacks testnet
- Updated deployment plan references `tic-tac-toe-v2` contract
- Frontend configured for testnet-only operation

## Future Enhancements

### Potential Improvements
1. **Bracket-Style Tournaments**: Traditional elimination brackets
2. **Tournament Winners**: Overall tournament champions with larger prizes
3. **Tournament Types**: Different tournament formats (round-robin, etc.)
4. **Spectator Mode**: Allow non-participants to view tournament progress
5. **Tournament History**: Player tournament statistics and history
6. **Mainnet Support**: Deploy to Stacks mainnet when ready

## Files Changed

### Smart Contract
- `contracts/tic-tac-toe.clar` - Updated to v2 with tournament functions
- `tests/tic-tac-toe.test.ts` - Added comprehensive tournament tests

### Frontend Core
- `frontend/lib/contract.ts` - Added tournament functions and types
- `frontend/hooks/use-stacks.ts` - Enhanced with network context
- `frontend/contexts/network-context.tsx` - New network state management

### Frontend Pages
- `frontend/app/tournaments/page.tsx` - New main tournaments page
- `frontend/app/tournament/[id]/page.tsx` - New individual tournament page
- `frontend/app/page.tsx` - Added tournament navigation link

### Frontend Components
- `frontend/components/create-tournament.tsx` - New tournament creation
- `frontend/components/tournament-card.tsx` - New tournament display
- `frontend/components/tournaments-list.tsx` - New tournament grid
- `frontend/components/navbar.tsx` - Added tournaments link
- `frontend/components/games-list.tsx` - Added tournament badges
- `frontend/components/play-game.tsx` - Added tournament context
- `frontend/components/game-board.tsx` - Enhanced UX with win highlighting

### Configuration & Deployment
- `deployments/default.testnet-plan.yaml` - Updated for tic-tac-toe-v2
- Frontend configuration for testnet-only operation

This tournament system transforms the simple 1v1 tic-tac-toe game into a multi-player tournament platform while maintaining the core game mechanics and blockchain integration.