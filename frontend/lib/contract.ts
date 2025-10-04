import { STACKS_TESTNET, StacksNetwork } from "@stacks/network";
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

// Contract configuration - TESTNET ONLY (contract not deployed on mainnet)
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "STZ5Q1C2GVSMCWS9NWVDEKHNW04THC75SEGDHS74";
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || "tic-tac-toe-v3";

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

// Helper function to check if a game is a draw
export function isGameDraw(game: Game): boolean {
  // In draws, the winner is set to the contract itself (address.contract-name)
  const contractIdentifier = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
  return game.winner === contractIdentifier;
}

// Helper function to check if a game is over (won or drawn)
export function isGameOver(game: Game): boolean {
  // Game is over if there's a winner (includes ties where winner = contract address)
  if (game.winner !== null) {
    return true;
  }

  // Also check if the board is full as a backup (shouldn't be needed if contract is working correctly)
  return isBoardFull(game.board);
}

// Helper function to check if the board is full
export function isBoardFull(board: number[]): boolean {
  return board.every((cell) => cell !== Move.EMPTY);
}

// Client-side win detection logic (mirrors contract's has-won function)
export function checkWinCondition(board: number[]): "X" | "O" | null {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const [a, b, c] of winPatterns) {
    if (
      board[a] !== Move.EMPTY &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a] === Move.X ? "X" : "O";
    }
  }
  return null;
}

// Check if the current board state is a tie
export function checkTieCondition(board: number[]): boolean {
  return isBoardFull(board) && checkWinCondition(board) === null;
}

// Get the winning pattern indices if there's a winner
export function getWinningPattern(board: number[]): number[] | null {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const [a, b, c] of winPatterns) {
    if (
      board[a] !== Move.EMPTY &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return [a, b, c];
    }
  }
  return null;
}

// Comprehensive game status checker
export function getGameStatus(board: number[]): {
  isOver: boolean;
  winner: "X" | "O" | null;
  isTie: boolean;
  status: "active" | "won" | "tie";
  winningPattern: number[] | null;
} {
  const winner = checkWinCondition(board);
  const isTie = checkTieCondition(board);
  const winningPattern = winner ? getWinningPattern(board) : null;

  return {
    isOver: winner !== null || isTie,
    winner,
    isTie,
    status: winner ? "won" : isTie ? "tie" : "active",
    winningPattern,
  };
}

export async function getAllGames(network: StacksNetwork = STACKS_TESTNET) {
  // Fetch the latest-game-id from the contract
  const latestGameIdCV = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-latest-game-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network,
  })) as UIntCV;

  // Convert the uintCV to a JS/TS number type
  const latestGameId = Math.floor(Number(latestGameIdCV.value.toString()));

  // Validate latestGameId
  if (isNaN(latestGameId) || latestGameId < 0) {
    console.warn("Invalid latestGameId:", latestGameId);
    return [];
  }

  // Loop from 0 to latestGameId-1 and fetch the game details for each game
  const games: Game[] = [];
  for (let i = 0; i < latestGameId; i++) {
    try {
      const game = await getGame(i, network);
      if (game) games.push(game);
    } catch {
      // Continue with other games
    }
  }
  return games;
}

export async function getGame(
  gameId: number,
  network: StacksNetwork = STACKS_TESTNET
) {
  // Validate gameId is a valid integer
  if (!Number.isInteger(gameId) || gameId < 0) {
    throw new Error(
      `Invalid game ID: ${gameId}. Must be a non-negative integer.`
    );
  }

  // Use the get-game read only function to fetch the game details for the given gameId
  const gameDetails = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-game",
    functionArgs: [uintCV(gameId)],
    senderAddress: CONTRACT_ADDRESS,
    network,
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
      gameCV["player-two"]?.type === "some"
        ? gameCV["player-two"].value.value
        : null,
    "is-player-one-turn": cvToValue(gameCV["is-player-one-turn"]),
    "bet-amount": parseInt(gameCV["bet-amount"].value.toString()),
    board: gameCV["board"].value.map((cell) => parseInt(cell.value.toString())),
    winner:
      gameCV["winner"]?.type === "some" ? gameCV["winner"].value.value : null,
    "tournament-id":
      gameCV["tournament-id"]?.type === "some"
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

export async function getAllTournaments(
  network: StacksNetwork = STACKS_TESTNET
) {
  // Fetch the latest-tournament-id from the contract
  const latestTournamentIdCV = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-latest-tournament-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network,
  })) as UIntCV;

  // Convert the uintCV to a JS/TS number type
  const latestTournamentId = parseInt(latestTournamentIdCV.value.toString());

  // Loop from 0 to latestTournamentId-1 and fetch the tournament details for each tournament
  const tournaments: Tournament[] = [];
  for (let i = 0; i < latestTournamentId; i++) {
    const tournament = await getTournament(i, network);
    if (tournament) {
      tournaments.push(tournament);
    }
  }
  return tournaments;
}

export async function getTournament(
  tournamentId: number,
  network: StacksNetwork = STACKS_TESTNET
) {
  // Use the get-tournament read only function to fetch the tournament details for the given tournamentId
  const tournamentDetails = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-tournament",
    functionArgs: [uintCV(tournamentId)],
    senderAddress: CONTRACT_ADDRESS,
    network,
  });

  const responseCV = tournamentDetails as OptionalCV<TupleCV<TournamentCV>>;
  // If we get back a none, then the tournament does not exist and we return null
  if (responseCV.type === "none") {
    return null;
  }
  // If we get back a value that is not a tuple, something went wrong and we return null
  if (responseCV.value.type !== "tuple") {
    return null;
  }

  // If we got back a TournamentCV tuple, we can convert it to a Tournament object
  const tournamentCV = responseCV.value.value;

  const tournament: Tournament = {
    id: tournamentId,
    creator: tournamentCV["creator"].value,
    "entry-fee": parseInt(tournamentCV["entry-fee"].value.toString()),
    "max-players": parseInt(tournamentCV["max-players"].value.toString()),
    "current-players": parseInt(
      tournamentCV["current-players"].value.toString()
    ),
    status: parseInt(
      tournamentCV["status"].value.toString()
    ) as TournamentStatus,
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

// Tournament Game Functions

export async function getTournamentGames(
  tournamentId: number,
  network: StacksNetwork = STACKS_TESTNET
) {
  // Get all games and filter by tournament ID
  const allGames = await getAllGames(network);
  const tournamentGames = allGames.filter(
    (game) => game["tournament-id"] === tournamentId
  );

  return tournamentGames;
}

export async function getTournamentParticipant(
  tournamentId: number,
  slot: number,
  network: StacksNetwork = STACKS_TESTNET
) {
  const participantDetails = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-tournament-participant",
    functionArgs: [uintCV(tournamentId), uintCV(slot)],
    senderAddress: CONTRACT_ADDRESS,
    network,
  });

  const responseCV = participantDetails as OptionalCV<PrincipalCV>;
  return responseCV.type === "some" ? responseCV.value.value : null;
}

export async function getAllTournamentParticipants(
  tournamentId: number,
  maxPlayers: number,
  network: StacksNetwork = STACKS_TESTNET
) {
  const participants: string[] = [];

  for (let slot = 0; slot < maxPlayers; slot++) {
    const participant = await getTournamentParticipant(
      tournamentId,
      slot,
      network
    );
    if (participant) {
      participants.push(participant);
    }
  }

  return participants;
}

export async function isUserInTournament(
  tournamentId: number,
  userAddress: string,
  maxPlayers: number,
  network: StacksNetwork = STACKS_TESTNET
): Promise<boolean> {
  const participants = await getAllTournamentParticipants(
    tournamentId,
    maxPlayers,
    network
  );
  return participants.includes(userAddress);
}
