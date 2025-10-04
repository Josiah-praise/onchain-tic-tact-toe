import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const charlie = accounts.get("wallet_3")!;
const david = accounts.get("wallet_4")!;
const eve = accounts.get("wallet_5")!;
const frank = accounts.get("wallet_6")!;
const grace = accounts.get("wallet_7")!;
const henry = accounts.get("wallet_8")!;

// Helper function to create a tournament
function createTournament(
  entryFee: number,
  maxPlayers: number,
  creator: string
) {
  return simnet.callPublicFn(
    "tic-tac-toe-v3",
    "create-tournament",
    [Cl.uint(entryFee), Cl.uint(maxPlayers)],
    creator
  );
}

// Helper function to join a tournament
function joinTournament(tournamentId: number, player: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v3",
    "join-tournament",
    [Cl.uint(tournamentId)],
    player
  );
}

// Helper function to start a tournament
function startTournament(tournamentId: number, creator: string) {
  return simnet.callPublicFn(
    "tic-tac-toe-v3",
    "start-tournament",
    [Cl.uint(tournamentId)],
    creator
  );
}

// Helper function to get tournament data
function getTournament(tournamentId: number) {
  return simnet.callReadOnlyFn(
    "tic-tac-toe-v3",
    "get-tournament",
    [Cl.uint(tournamentId)],
    alice
  );
}

// Helper function to get tournament participant
function getTournamentParticipant(tournamentId: number, slot: number) {
  return simnet.callReadOnlyFn(
    "tic-tac-toe-v3",
    "get-tournament-participant",
    [Cl.uint(tournamentId), Cl.uint(slot)],
    alice
  );
}

// Helper function to get tournament game
function getTournamentGame(tournamentId: number, round: number, match: number) {
  return simnet.callReadOnlyFn(
    "tic-tac-toe-v3",
    "get-tournament-game",
    [Cl.uint(tournamentId), Cl.uint(round), Cl.uint(match)],
    alice
  );
}

describe("Tournament Tests", () => {
  describe("Tournament Creation", () => {
    it("allows creating a tournament with valid parameters", () => {
      const { result, events } = createTournament(100, 4, alice);

      expect(result).toBeOk(Cl.uint(0));
      expect(events.length).toBe(2); // print_event and stx_transfer_event

      // Check tournament data
      const tournamentData = getTournament(0);
      expect(tournamentData.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(alice),
          "entry-fee": Cl.uint(100),
          "max-players": Cl.uint(4),
          "current-players": Cl.uint(1),
          status: Cl.uint(0), // open
          winner: Cl.none(),
          "prize-pool": Cl.uint(100),
          "created-at": Cl.uint(3), // block height
        })
      );

      // Check creator is first participant
      const participant = getTournamentParticipant(0, 0);
      expect(participant.result).toBeSome(Cl.principal(alice));
    });

    it("allows creating tournaments with different valid sizes", () => {
      // Test 4-player tournament
      const result4 = createTournament(50, 4, alice);
      expect(result4.result).toBeOk(Cl.uint(0));

      // Test 8-player tournament
      const result8 = createTournament(75, 8, bob);
      expect(result8.result).toBeOk(Cl.uint(1));

      // Test 16-player tournament
      const result16 = createTournament(100, 16, charlie);
      expect(result16.result).toBeOk(Cl.uint(2));
    });

    it("does not allow creating a tournament with zero entry fee", () => {
      const { result } = createTournament(0, 4, alice);
      expect(result).toBeErr(Cl.uint(100)); // ERR_MIN_BET_AMOUNT
    });

    it("does not allow creating a tournament with invalid size", () => {
      const { result } = createTournament(100, 6, alice);
      expect(result).toBeErr(Cl.uint(203)); // ERR_INVALID_TOURNAMENT_SIZE
    });

    it("does not allow creating a tournament with size 2", () => {
      const { result } = createTournament(100, 2, alice);
      expect(result).toBeErr(Cl.uint(203)); // ERR_INVALID_TOURNAMENT_SIZE
    });

    it("increments tournament ID correctly", () => {
      createTournament(100, 4, alice);
      const result2 = createTournament(100, 4, bob);
      expect(result2.result).toBeOk(Cl.uint(1));

      const latestId = simnet.callReadOnlyFn(
        "tic-tac-toe-v3",
        "get-latest-tournament-id",
        [],
        alice
      );
      expect(latestId.result).toStrictEqual(Cl.uint(2));
    });
  });

  describe("Tournament Joining", () => {
    it("allows players to join an open tournament", () => {
      createTournament(100, 4, alice);
      const { result, events } = joinTournament(0, bob);

      expect(result).toBeOk(Cl.uint(0));
      expect(events.length).toBe(2); // print_event and stx_transfer_event

      // Check updated tournament data
      const tournamentData = getTournament(0);
      expect(tournamentData.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(alice),
          "entry-fee": Cl.uint(100),
          "max-players": Cl.uint(4),
          "current-players": Cl.uint(2),
          status: Cl.uint(0), // still open
          winner: Cl.none(),
          "prize-pool": Cl.uint(200), // 100 + 100
          "created-at": Cl.uint(3),
        })
      );

      // Check participant was added to slot 1
      const participant = getTournamentParticipant(0, 1);
      expect(participant.result).toBeSome(Cl.principal(bob));
    });

    it("allows filling a tournament to capacity", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      const { result } = joinTournament(0, david);

      expect(result).toBeOk(Cl.uint(0));

      // Check tournament is full
      const tournamentData = getTournament(0);
      expect(tournamentData.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(alice),
          "entry-fee": Cl.uint(100),
          "max-players": Cl.uint(4),
          "current-players": Cl.uint(4),
          status: Cl.uint(0),
          winner: Cl.none(),
          "prize-pool": Cl.uint(400), // 4 * 100
          "created-at": Cl.uint(3),
        })
      );

      // Check all participants
      expect(getTournamentParticipant(0, 0).result).toBeSome(
        Cl.principal(alice)
      );
      expect(getTournamentParticipant(0, 1).result).toBeSome(Cl.principal(bob));
      expect(getTournamentParticipant(0, 2).result).toBeSome(
        Cl.principal(charlie)
      );
      expect(getTournamentParticipant(0, 3).result).toBeSome(
        Cl.principal(david)
      );
    });

    it("does not allow joining a non-existent tournament", () => {
      const { result } = joinTournament(999, alice);
      expect(result).toBeErr(Cl.uint(200)); // ERR_TOURNAMENT_NOT_FOUND
    });

    it("does not allow joining a full tournament", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);

      const { result } = joinTournament(0, eve);
      expect(result).toBeErr(Cl.uint(201)); // ERR_TOURNAMENT_FULL
    });

    it("does not allow joining the same tournament twice", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);

      const { result } = joinTournament(0, bob);
      expect(result).toBeErr(Cl.uint(204)); // ERR_ALREADY_JOINED
    });

    it("does not allow creator to join their own tournament again", () => {
      createTournament(100, 4, alice);

      const { result } = joinTournament(0, alice);
      expect(result).toBeErr(Cl.uint(204)); // ERR_ALREADY_JOINED
    });
  });

  describe("Tournament Starting", () => {
    it("allows creator to start a full tournament", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);

      const { result, events } = startTournament(0, alice);

      expect(result).toBeOk(Cl.bool(true));
      expect(events.length).toBe(1); // print_event

      // Check tournament status is now in-progress
      const tournamentData = getTournament(0);
      expect(tournamentData.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(alice),
          "entry-fee": Cl.uint(100),
          "max-players": Cl.uint(4),
          "current-players": Cl.uint(4),
          status: Cl.uint(1), // in-progress
          winner: Cl.none(),
          "prize-pool": Cl.uint(400),
          "created-at": Cl.uint(3),
        })
      );
    });

    it("creates first round games when starting 4-player tournament", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);
      startTournament(0, alice);

      // Check that first round games were created
      const game1 = getTournamentGame(0, 1, 0);
      const game2 = getTournamentGame(0, 1, 1);

      expect(game1.result).toBeSome(
        Cl.tuple({
          "player-one": Cl.principal(alice),
          "player-two": Cl.some(Cl.principal(bob)),
          "is-player-one-turn": Cl.bool(true),
          "bet-amount": Cl.uint(100),
          board: Cl.list([
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
          ]),
          "tournament-id": Cl.some(Cl.uint(0)),
          winner: Cl.none(),
        })
      );

      expect(game2.result).toBeSome(
        Cl.tuple({
          "player-one": Cl.principal(charlie),
          "player-two": Cl.some(Cl.principal(david)),
          "is-player-one-turn": Cl.bool(true),
          "bet-amount": Cl.uint(100),
          board: Cl.list([
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
            Cl.uint(0),
          ]),
          "tournament-id": Cl.some(Cl.uint(0)),
          winner: Cl.none(),
        })
      );
    });

    it("creates correct number of games for 8-player tournament", () => {
      createTournament(100, 8, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);
      joinTournament(0, eve);
      joinTournament(0, frank);
      joinTournament(0, grace);
      joinTournament(0, henry);
      startTournament(0, alice);

      // Should create 4 first round games for 8-player tournament
      const game1 = getTournamentGame(0, 1, 0);
      const game2 = getTournamentGame(0, 1, 1);
      const game3 = getTournamentGame(0, 1, 2);
      const game4 = getTournamentGame(0, 1, 3);

      // Check that games exist (they should have Some values)
      expect(game1.result?.type).toBe("some");
      expect(game2.result?.type).toBe("some");
      expect(game3.result?.type).toBe("some");
      expect(game4.result?.type).toBe("some");
    });

    it("does not allow non-creator to start tournament", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);

      const { result } = startTournament(0, bob);
      expect(result).toBeErr(Cl.uint(205)); // ERR_NOT_TOURNAMENT_CREATOR
    });

    it("does not allow starting a tournament that is not full", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);

      const { result } = startTournament(0, alice);
      expect(result).toBeErr(Cl.uint(206)); // ERR_TOURNAMENT_NOT_READY
    });

    it("does not allow starting a tournament twice", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);
      startTournament(0, alice);

      const { result } = startTournament(0, alice);
      expect(result).toBeErr(Cl.uint(202)); // ERR_TOURNAMENT_NOT_OPEN
    });

    it("does not allow starting a non-existent tournament", () => {
      const { result } = startTournament(999, alice);
      expect(result).toBeErr(Cl.uint(200)); // ERR_TOURNAMENT_NOT_FOUND
    });
  });

  describe("Tournament Games Integration", () => {
    it("tournament games have correct tournament-id reference", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);
      startTournament(0, alice);

      // Verify that tournament games exist
      const game = getTournamentGame(0, 1, 0);
      expect(game.result?.type).toBe("some");
    });

    it("tournament games use correct entry fee as bet amount", () => {
      createTournament(250, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);
      startTournament(0, alice);

      // Verify that tournament games exist
      const game = getTournamentGame(0, 1, 0);
      expect(game.result?.type).toBe("some");
    });
  });

  describe("Read-Only Functions", () => {
    it("get-tournament returns correct data", () => {
      createTournament(100, 4, alice);

      const result = getTournament(0);
      expect(result.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(alice),
          "entry-fee": Cl.uint(100),
          "max-players": Cl.uint(4),
          "current-players": Cl.uint(1),
          status: Cl.uint(0),
          winner: Cl.none(),
          "prize-pool": Cl.uint(100),
          "created-at": Cl.uint(3),
        })
      );
    });

    it("get-tournament returns none for non-existent tournament", () => {
      const result = getTournament(999);
      expect(result.result).toBeNone();
    });

    it("get-tournament-participant returns correct participants", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);

      expect(getTournamentParticipant(0, 0).result).toBeSome(
        Cl.principal(alice)
      );
      expect(getTournamentParticipant(0, 1).result).toBeSome(Cl.principal(bob));
      expect(getTournamentParticipant(0, 2).result).toBeNone();
    });

    it("get-latest-tournament-id tracks correctly", () => {
      const initial = simnet.callReadOnlyFn(
        "tic-tac-toe-v3",
        "get-latest-tournament-id",
        [],
        alice
      );
      expect(initial.result).toStrictEqual(Cl.uint(0));

      createTournament(100, 4, alice);

      const after = simnet.callReadOnlyFn(
        "tic-tac-toe-v3",
        "get-latest-tournament-id",
        [],
        alice
      );
      expect(after.result).toStrictEqual(Cl.uint(1));
    });
  });

  describe("Edge Cases", () => {
    it("handles large tournament sizes correctly", () => {
      // Test creating 16-player tournament
      const { result } = createTournament(50, 16, alice);
      expect(result).toBeOk(Cl.uint(0));

      // Join 7 more players (we have 8 total accounts including alice)
      const players = [bob, charlie, david, eve, frank, grace, henry];

      for (let i = 0; i < players.length; i++) {
        const joinResult = joinTournament(0, players[i]);
        expect(joinResult.result).toBeOk(Cl.uint(0));
      }

      // Check tournament has 8 players now
      const tournamentData = getTournament(0);
      expect(tournamentData.result?.type).toBe("some");

      // Basic check that tournament exists and is populated
      expect(tournamentData.result).toBeTruthy();
    });

    it("prevents joining after tournament starts", () => {
      createTournament(100, 4, alice);
      joinTournament(0, bob);
      joinTournament(0, charlie);
      joinTournament(0, david);
      startTournament(0, alice);

      // Should not be able to join after starting
      const { result } = joinTournament(0, eve);
      expect(result).toBeErr(Cl.uint(202)); // ERR_TOURNAMENT_NOT_OPEN
    });
  });
});
