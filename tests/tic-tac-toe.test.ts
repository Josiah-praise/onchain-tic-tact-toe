import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const charlie = accounts.get("wallet_3")!;
const dave = accounts.get("wallet_4")!;

// Helper function to create a new game with the given bet amount, move index, and move
// on behalf of the `user` address
function createGame(
  betAmount: number,
  moveIndex: number,
  move: number,
  user: string
) {
  return simnet.callPublicFn(
    "tic-tac-toe-v2",
    "create-game",
    [Cl.uint(betAmount), Cl.uint(moveIndex), Cl.uint(move)],
    user
  );
}

// Helper function to join a game with the given move index and move on behalf of the `user` address
function joinGame(moveIndex: number, move: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v2",
    "join-game",
    [Cl.uint(0), Cl.uint(moveIndex), Cl.uint(move)],
    user
  );
}

// Helper function to play a move with the given move index and move on behalf of the `user` address
function play(moveIndex: number, move: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v2",
    "play",
    [Cl.uint(0), Cl.uint(moveIndex), Cl.uint(move)],
    user
  );
}

// Tournament helper functions
function createTournament(entryFee: number, maxPlayers: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v2",
    "create-tournament",
    [Cl.uint(entryFee), Cl.uint(maxPlayers)],
    user
  );
}

function joinTournament(tournamentId: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v2",
    "join-tournament",
    [Cl.uint(tournamentId)],
    user
  );
}

function startTournament(tournamentId: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v2",
    "start-tournament",
    [Cl.uint(tournamentId)],
    user
  );
}

function getTournament(tournamentId: number) {
  return simnet.callReadOnlyFn(
    "tic-tac-toe-v2",
    "get-tournament",
    [Cl.uint(tournamentId)],
    alice
  );
}

function getTournamentParticipant(tournamentId: number, slot: number) {
  return simnet.callReadOnlyFn(
    "tic-tac-toe-v2",
    "get-tournament-participant",
    [Cl.uint(tournamentId), Cl.uint(slot)],
    alice
  );
}

describe("Tic Tac Toe Tests", () => {
  it("allows game creation", () => {
    const { result, events } = createGame(100, 0, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event
  });

  it("allows game joining", () => {
    createGame(100, 0, 1, alice);
    const { result, events } = joinGame(1, 2, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event
  });

  it("allows game playing", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);
    const { result, events } = play(2, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(1); // print_event
  });

  it("does not allow creating a game with a bet amount of 0", () => {
    const { result } = createGame(0, 0, 1, alice);
    expect(result).toBeErr(Cl.uint(100));
  });

  it("does not allow joining a game that has already been joined", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = joinGame(1, 2, alice);
    expect(result).toBeErr(Cl.uint(103));
  });

  it("does not allow an out of bounds move", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(10, 1, alice);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("does not allow a non X or O move", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(2, 3, alice);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("does not allow moving on an occupied spot", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(1, 1, alice);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("allows player one to win", () => {
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    const { result, events } = play(2, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event

    const gameData = simnet.getMapEntry("tic-tac-toe-v2", "games", Cl.uint(0));
    expect(gameData).toBeSome(
      Cl.tuple({
        "player-one": Cl.principal(alice),
        "player-two": Cl.some(Cl.principal(bob)),
        "is-player-one-turn": Cl.bool(false),
        "bet-amount": Cl.uint(100),
        board: Cl.list([
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
        ]),
        "tournament-id": Cl.none(),
        winner: Cl.some(Cl.principal(alice)),
      })
    );
  });

  it("allows player two to win", () => {
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    play(8, 1, alice);
    const { result, events } = play(5, 2, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event

    const gameData = simnet.getMapEntry("tic-tac-toe-v2", "games", Cl.uint(0));
    expect(gameData).toBeSome(
      Cl.tuple({
        "player-one": Cl.principal(alice),
        "player-two": Cl.some(Cl.principal(bob)),
        "is-player-one-turn": Cl.bool(true),
        "bet-amount": Cl.uint(100),
        board: Cl.list([
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(0),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(1),
        ]),
        "tournament-id": Cl.none(),
        winner: Cl.some(Cl.principal(bob)),
      })
    );
  });

  it("prevents moves after game is won", () => {
    // Create a game and let player one win
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    play(2, 1, alice); // Alice wins with three X's in a row

    // Try to make another move after the game is won - should fail
    const { result } = play(5, 2, bob);
    expect(result).toBeErr(Cl.uint(105)); // ERR_GAME_ALREADY_OVER
  });

  it("handles draw/tie games correctly", () => {
    // Create a game and play to a draw
    createGame(100, 4, 1, alice); // X in center
    joinGame(0, 2, bob); // O in top-left
    play(8, 1, alice); // X in bottom-right
    play(1, 2, bob); // O in top-center
    play(7, 1, alice); // X in bottom-center
    play(5, 2, bob); // O in middle-right
    play(3, 1, alice); // X in middle-left
    play(6, 2, bob); // O in bottom-left
    const { result, events } = play(2, 1, alice); // X in top-right - board is now full

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(3); // Two transfers (refunds) and one print event

    const gameData = simnet.getMapEntry("tic-tac-toe-v2", "games", Cl.uint(0));
    expect(gameData).toBeSome(
      Cl.tuple({
        "player-one": Cl.principal(alice),
        "player-two": Cl.some(Cl.principal(bob)),
        "is-player-one-turn": Cl.bool(false),
        "bet-amount": Cl.uint(100),
        board: Cl.list([
          Cl.uint(2), // O
          Cl.uint(2), // O
          Cl.uint(1), // X
          Cl.uint(1), // X
          Cl.uint(1), // X
          Cl.uint(2), // O
          Cl.uint(2), // O
          Cl.uint(1), // X
          Cl.uint(1), // X
        ]),
        "tournament-id": Cl.none(),
        // Winner should be the contract address (indicating a draw)
        winner: Cl.some(
          Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tic-tac-toe")
        ),
      })
    );
  });
});

describe("Tournament System Tests", () => {
  it("allows tournament creation with valid parameters", () => {
    const { result, events } = createTournament(1000, 4, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // stx_transfer_event and print_event

    // Check tournament was created correctly
    const { result: tournamentResult } = getTournament(0);
    expect(tournamentResult).toBeSome();
    const tournament = tournamentResult.expectSome();
    expect(Cl.unwrap(tournament)["creator"]).toEqual(Cl.principal(alice));
    expect(Cl.unwrap(tournament)["entry-fee"]).toEqual(Cl.uint(1000));
    expect(Cl.unwrap(tournament)["max-players"]).toEqual(Cl.uint(4));
    expect(Cl.unwrap(tournament)["current-players"]).toEqual(Cl.uint(1));
    expect(Cl.unwrap(tournament)["status"]).toEqual(Cl.uint(0));
    expect(Cl.unwrap(tournament)["winner"]).toEqual(Cl.none());
    expect(Cl.unwrap(tournament)["prize-pool"]).toEqual(Cl.uint(1000));
  });

  it("validates tournament size restrictions", () => {
    const { result } = createTournament(1000, 6, alice); // Invalid size
    expect(result).toBeErr(Cl.uint(203)); // ERR_INVALID_TOURNAMENT_SIZE
  });

  it("requires minimum entry fee", () => {
    const { result } = createTournament(0, 4, alice); // Zero entry fee
    expect(result).toBeErr(Cl.uint(100)); // ERR_MIN_BET_AMOUNT
  });

  it("allows players to join tournaments", () => {
    createTournament(1000, 4, alice);
    const { result, events } = joinTournament(0, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // stx_transfer_event and print_event

    // Check participant was added
    const { result: participantResult } = getTournamentParticipant(0, 1);
    expect(participantResult).toBeSome(Cl.principal(bob));

    // Check tournament updated
    const { result: tournamentResult } = getTournament(0);
    expect(tournamentResult).toBeSome();
    const tournament = tournamentResult.expectSome();
    expect(Cl.unwrap(tournament)["current-players"]).toEqual(Cl.uint(2));
    expect(Cl.unwrap(tournament)["prize-pool"]).toEqual(Cl.uint(2000));
  });

  it("prevents joining full tournaments", () => {
    createTournament(1000, 4, alice);
    joinTournament(0, bob);
    joinTournament(0, charlie);
    joinTournament(0, dave);

    // Try to join when full
    const { result } = joinTournament(0, accounts.get("wallet_5")!);
    expect(result).toBeErr(Cl.uint(201)); // ERR_TOURNAMENT_FULL
  });

  it("prevents duplicate tournament entries", () => {
    createTournament(1000, 4, alice);

    // Try to join again as creator
    const { result } = joinTournament(0, alice);
    expect(result).toBeErr(Cl.uint(204)); // ERR_ALREADY_JOINED
  });

  it("prevents joining non-existent tournaments", () => {
    const { result } = joinTournament(999, bob);
    expect(result).toBeErr(Cl.uint(200)); // ERR_TOURNAMENT_NOT_FOUND
  });

  it("allows tournament creator to start full tournament", () => {
    createTournament(1000, 4, alice);
    joinTournament(0, bob);
    joinTournament(0, charlie);
    joinTournament(0, dave);

    const { result, events } = startTournament(0, alice);
    expect(result).toBeOk(Cl.bool(true));

    // Check tournament status changed to in-progress
    const { result: tournamentResult } = getTournament(0);
    const tournament = tournamentResult.expectSome();
    expect(Cl.unwrap(tournament)["status"]).toEqual(Cl.uint(1));
  });

  it("prevents non-creator from starting tournament", () => {
    createTournament(1000, 4, alice);
    joinTournament(0, bob);
    joinTournament(0, charlie);
    joinTournament(0, dave);

    const { result } = startTournament(0, bob); // Non-creator tries to start
    expect(result).toBeErr(Cl.uint(205)); // ERR_NOT_TOURNAMENT_CREATOR
  });

  it("prevents starting incomplete tournaments", () => {
    createTournament(1000, 4, alice);
    joinTournament(0, bob); // Only 2 players

    const { result } = startTournament(0, alice);
    expect(result).toBeErr(Cl.uint(206)); // ERR_TOURNAMENT_NOT_READY
  });

  it("creates games when tournament starts", () => {
    createTournament(1000, 4, alice);
    joinTournament(0, bob);
    joinTournament(0, charlie);
    joinTournament(0, dave);

    // Check current game count
    const { result: latestGameId } = simnet.callReadOnlyFn(
      "tic-tac-toe-v2",
      "get-latest-game-id",
      [],
      alice
    );
    const gameCountBefore = latestGameId.expectUint();

    startTournament(0, alice);

    // Check that new games were created
    const { result: newLatestGameId } = simnet.callReadOnlyFn(
      "tic-tac-toe-v2",
      "get-latest-game-id",
      [],
      alice
    );
    const gameCountAfter = newLatestGameId.expectUint();

    expect(gameCountAfter).toBeGreaterThan(gameCountBefore);

    // Check that the new games have tournament-id
    const game1 = simnet.getMapEntry(
      "tic-tac-toe-v2",
      "games",
      Cl.uint(Number(gameCountBefore))
    );
    expect(game1).toBeSome();
    const game1Data = game1.expectSome();
    expect(Cl.unwrap(game1Data)["tournament-id"]).toEqual(Cl.some(Cl.uint(0)));
  });

  it("handles 8-player tournament creation", () => {
    const { result } = createTournament(500, 8, alice);
    expect(result).toBeOk(Cl.uint(0));

    const { result: tournamentResult } = getTournament(0);
    const tournament = tournamentResult.expectSome();
    expect(Cl.unwrap(tournament)["max-players"]).toEqual(Cl.uint(8));
  });

  it("handles 16-player tournament creation", () => {
    const { result } = createTournament(250, 16, alice);
    expect(result).toBeOk(Cl.uint(0));

    const { result: tournamentResult } = getTournament(0);
    const tournament = tournamentResult.expectSome();
    expect(Cl.unwrap(tournament)["max-players"]).toEqual(Cl.uint(16));
  });
});
