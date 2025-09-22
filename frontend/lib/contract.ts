import { STACKS_TESTNET } from "@stacks/network";
import {
  BooleanCV,
  cvToValue,
  fetchCallReadOnlyFunction,
  ListCV,
  OptionalCV,
  PrincipalCV,
  TupleCV,
  uintCV,
  UIntCV,
} from "@stacks/transactions";

// REPLACE THESE WITH YOUR OWN
const CONTRACT_ADDRESS =
  "STZ5Q1C2GVSMCWS9NWVDEKHNW04THC75SEGDHS74";
const CONTRACT_NAME = "tic-tac-toe";

type GameCV = {
  "player-one": PrincipalCV;
  "player-two": OptionalCV<PrincipalCV>;
  "is-player-one-turn": BooleanCV;
  "bet-amount": UIntCV;
  board: ListCV<UIntCV>;
  winner: OptionalCV<PrincipalCV>;
  "tournament-id": OptionalCV<UIntCV>;
};

type TournamentCV = {
  creator: PrincipalCV;
  "entry-fee": UIntCV;
  "max-players": UIntCV;
  "current-players": UIntCV;
  status: UIntCV;
  winner: OptionalCV<PrincipalCV>;
  "prize-pool": UIntCV;
  "created-at": UIntCV;
};

export type Game = {
  id: number;
  "player-one": string;
  "player-two": string | null;
  "is-player-one-turn": boolean;
  "bet-amount": number;
  board: number[];
  winner: string | null;
  "tournament-id": number | null;
};

export type Tournament = {
  id: number;
  creator: string;
  "entry-fee": number;
  "max-players": number;
  "current-players": number;
  status: TournamentStatus;
  winner: string | null;
  "prize-pool": number;
  "created-at": number;
};

export enum TournamentStatus {
  OPEN = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
}

export enum Move {
  EMPTY = 0,
  X = 1,
  O = 2,
}

export const EMPTY_BOARD = [
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
];

export async function getAllGames() {
  // Fetch the latest-game-id from the contract
  const latestGameIdCV = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-latest-game-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: STACKS_TESTNET,
  })) as UIntCV;

  // Convert the uintCV to a JS/TS number type
  const latestGameId = parseInt(latestGameIdCV.value.toString());

  // Loop from 0 to latestGameId-1 and fetch the game details for each game
  const games: Game[] = [];
  for (let i = 0; i < latestGameId; i++) {
    const game = await getGame(i);
    if (game) games.push(game);
  }
  return games;
}

export async function getGame(gameId: number) {
  // Use the get-game read only function to fetch the game details for the given gameId
  const gameDetails = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-game",
    functionArgs: [uintCV(gameId)],
    senderAddress: CONTRACT_ADDRESS,
    network: STACKS_TESTNET,
  });

  const responseCV = gameDetails as OptionalCV<TupleCV<GameCV>>;
  // If we get back a none, then the game does not exist and we return null
  if (responseCV.type === "none") return null;
  // If we get back a value that is not a tuple, something went wrong and we return null
  if (responseCV.value.type !== "tuple") return null;

  // If we got back a GameCV tuple, we can convert it to a Game object
  const gameCV = responseCV.value.value;

  const game: Game = {
    id: gameId,
    "player-one": gameCV["player-one"].value,
    "player-two":
      gameCV["player-two"].type === "some"
        ? gameCV["player-two"].value.value
        : null,
    "is-player-one-turn": cvToValue(gameCV["is-player-one-turn"]),
    "bet-amount": parseInt(gameCV["bet-amount"].value.toString()),
    board: gameCV["board"].value.map((cell) => parseInt(cell.value.toString())),
    winner:
      gameCV["winner"].type === "some" ? gameCV["winner"].value.value : null,
    "tournament-id":
      gameCV["tournament-id"].type === "some"
        ? parseInt(gameCV["tournament-id"].value.value.toString())
        : null,
  };
  return game;
}


export async function createNewGame(
  betAmount: number,
  moveIndex: number,
  move: Move
) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "create-game",
    functionArgs: [uintCV(betAmount), uintCV(moveIndex), uintCV(move)],
  };

  return txOptions;
}

export async function joinGame(gameId: number, moveIndex: number, move: Move) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "join-game",
    functionArgs: [uintCV(gameId), uintCV(moveIndex), uintCV(move)],
  };

  return txOptions;
}

export async function play(gameId: number, moveIndex: number, move: Move) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "play",
    functionArgs: [uintCV(gameId), uintCV(moveIndex), uintCV(move)],
  };

  return txOptions;
}

// Tournament Functions

export async function getAllTournaments() {
  // Fetch the latest-tournament-id from the contract
  const latestTournamentIdCV = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-latest-tournament-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: STACKS_TESTNET,
  })) as UIntCV;

  // Convert the uintCV to a JS/TS number type
  const latestTournamentId = parseInt(latestTournamentIdCV.value.toString());

  // Loop from 0 to latestTournamentId-1 and fetch the tournament details for each tournament
  const tournaments: Tournament[] = [];
  for (let i = 0; i < latestTournamentId; i++) {
    const tournament = await getTournament(i);
    if (tournament) tournaments.push(tournament);
  }
  return tournaments;
}

export async function getTournament(tournamentId: number) {
  // Use the get-tournament read only function to fetch the tournament details for the given tournamentId
  const tournamentDetails = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-tournament",
    functionArgs: [uintCV(tournamentId)],
    senderAddress: CONTRACT_ADDRESS,
    network: STACKS_TESTNET,
  });

  const responseCV = tournamentDetails as OptionalCV<TupleCV<TournamentCV>>;
  // If we get back a none, then the tournament does not exist and we return null
  if (responseCV.type === "none") return null;
  // If we get back a value that is not a tuple, something went wrong and we return null
  if (responseCV.value.type !== "tuple") return null;

  // If we got back a TournamentCV tuple, we can convert it to a Tournament object
  const tournamentCV = responseCV.value.value;

  const tournament: Tournament = {
    id: tournamentId,
    creator: tournamentCV["creator"].value,
    "entry-fee": parseInt(tournamentCV["entry-fee"].value.toString()),
    "max-players": parseInt(tournamentCV["max-players"].value.toString()),
    "current-players": parseInt(tournamentCV["current-players"].value.toString()),
    status: parseInt(tournamentCV["status"].value.toString()) as TournamentStatus,
    winner:
      tournamentCV["winner"].type === "some"
        ? tournamentCV["winner"].value.value
        : null,
    "prize-pool": parseInt(tournamentCV["prize-pool"].value.toString()),
    "created-at": parseInt(tournamentCV["created-at"].value.toString()),
  };
  return tournament;
}

export async function createTournament(entryFee: number, maxPlayers: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "create-tournament",
    functionArgs: [uintCV(entryFee), uintCV(maxPlayers)],
  };

  return txOptions;
}

export async function joinTournament(tournamentId: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "join-tournament",
    functionArgs: [uintCV(tournamentId)],
  };

  return txOptions;
}

export async function startTournament(tournamentId: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "start-tournament",
    functionArgs: [uintCV(tournamentId)],
  };

  return txOptions;
}

