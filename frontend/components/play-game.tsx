"use client";

import {
  Game,
  Move,
  isGameDraw,
  isGameOver,
  getGameStatus,
  getWinningPattern,
} from "@/lib/contract";
import { GameBoard } from "./game-board";
import { abbreviateAddress, explorerAddress, formatStx } from "@/lib/stx-utils";
import Link from "next/link";
import { useStacks } from "@/hooks/use-stacks";
import { useState, useEffect } from "react";

interface PlayGameProps {
  game: Game;
}

export function PlayGame({ game }: PlayGameProps) {
  const { userData, handleJoinGame, handlePlayGame } = useStacks();

  // Initial game board is the current `game.board` state
  const [board, setBoard] = useState(game.board);

  // cell where user played their move. -1 denotes no move has been played
  const [playedMoveIndex, setPlayedMoveIndex] = useState(-1);

  // Loading states for buttons
  const [isJoining, setIsJoining] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Real-time feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<
    "win" | "loss" | "tie" | "prediction"
  >("prediction");

  // Sync board state with game prop changes
  useEffect(() => {
    setBoard(game.board);
    setPlayedMoveIndex(-1); // Reset move selection when game updates
  }, [game.board]);

  // Check for game over conditions when the game state changes
  useEffect(() => {
    if (!userData) return;

    const userAddress = userData.profile.stxAddress.testnet;
    const isPlayerOne = userAddress === game["player-one"];
    const isPlayerTwo = userAddress === game["player-two"];
    const isJoinedAlready = isPlayerOne || isPlayerTwo;

    if (!isJoinedAlready) return;

    const gameStatus = getGameStatus(game.board);

    if (gameStatus.isOver) {
      if (gameStatus.winner) {
        const playerSymbol = isPlayerOne ? "X" : "O";
        if (gameStatus.winner === playerSymbol) {
          setFeedbackMessage("You Won!");
          setFeedbackType("win");
        } else {
          setFeedbackMessage("You Lost!");
          setFeedbackType("loss");
        }
      } else if (gameStatus.isTie) {
        setFeedbackMessage("It's a Tie!");
        setFeedbackType("tie");
      }
      setShowFeedback(true);
    } else {
      setShowFeedback(false);
    }
  }, [game, userData]);

  // If user is not logged in, don't show anything
  if (!userData) return null;

  const isPlayerOne =
    userData.profile.stxAddress.testnet === game["player-one"];
  const isPlayerTwo =
    userData.profile.stxAddress.testnet === game["player-two"];

  const isJoinable = game["player-two"] === null && !isPlayerOne;
  const isJoinedAlready = isPlayerOne || isPlayerTwo;
  const nextMove = game["is-player-one-turn"] ? Move.X : Move.O;
  const isMyTurn =
    (game["is-player-one-turn"] && isPlayerOne) ||
    (!game["is-player-one-turn"] && isPlayerTwo);
  const gameIsOver = isGameOver(game);
  const gameIsDraw = isGameDraw(game);

  function onCellClick(index: number) {
    // Don't allow clicking if any transaction is in progress
    if (isJoining || isPlaying) return;

    // Only allow clicking on empty cells
    if (game.board[index] !== 0) return;

    // Reset to original board and add only the new move
    const tempBoard = [...game.board];
    tempBoard[index] = nextMove;
    setBoard(tempBoard);
    setPlayedMoveIndex(index);

    // Check if this move would result in a win or tie
    if (userData) {
      const gameStatus = getGameStatus(tempBoard);
      if (gameStatus.isOver) {
        const userAddress = userData.profile.stxAddress.testnet;
        const isPlayerOne = userAddress === game["player-one"];
        const playerSymbol = isPlayerOne ? "X" : "O";

        if (gameStatus.winner) {
          if (gameStatus.winner === playerSymbol) {
            setFeedbackMessage("Winning Move!");
            setFeedbackType("win");
          } else {
            setFeedbackMessage("Opponent Wins!");
            setFeedbackType("loss");
          }
        } else if (gameStatus.isTie) {
          setFeedbackMessage("This Move Results in a Tie!");
          setFeedbackType("tie");
        }
        setShowFeedback(true);

        // Auto-hide feedback after 3 seconds
        setTimeout(() => {
          setShowFeedback(false);
        }, 3000);
      }
    }
  }

  async function handleJoinGameWithLoading() {
    if (isJoining || playedMoveIndex === -1) return;

    setIsJoining(true);
    try {
      await handleJoinGame(game.id, playedMoveIndex, nextMove);
    } finally {
      // Keep loading state for a bit to prevent rapid clicking
      setTimeout(() => setIsJoining(false), 2000);
    }
  }

  async function handlePlayGameWithLoading() {
    if (isPlaying || playedMoveIndex === -1) return;

    setIsPlaying(true);
    try {
      await handlePlayGame(game.id, playedMoveIndex, nextMove);
    } finally {
      // Keep loading state for a bit to prevent rapid clicking
      setTimeout(() => setIsPlaying(false), 2000);
    }
  }

  // Calculate winning pattern for highlighting
  const gameStatus = getGameStatus(board);
  const winningPattern =
    gameStatus.isOver && gameStatus.winner
      ? getWinningPattern(board) || []
      : [];

  return (
    <div className="flex flex-col gap-4 w-[400px]">
      <GameBoard
        board={board}
        onCellClick={onCellClick}
        nextMove={nextMove}
        cellClassName="size-32 text-6xl"
        disabled={
          gameIsOver || (!isMyTurn && !isJoinable) || isJoining || isPlaying
        }
        winningPattern={winningPattern}
      />

      {/* Game Status Feedback */}
      {showFeedback && (
        <div
          className={`
          p-4 rounded-lg text-center font-semibold text-lg transition-all duration-300 transform
          ${
            feedbackType === "win"
              ? "bg-green-100 text-green-800 border-2 border-green-300"
              : ""
          }
          ${
            feedbackType === "loss"
              ? "bg-red-100 text-red-800 border-2 border-red-300"
              : ""
          }
          ${
            feedbackType === "tie"
              ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
              : ""
          }
          animate-pulse
        `}
        >
          {feedbackMessage}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Tournament Context */}
        {game["tournament-id"] !== null && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-2">
            <div className="flex items-center justify-between">
              <span className="text-purple-700 font-medium">
                Tournament Game
              </span>
              <Link
                href={`/tournament/${game["tournament-id"]}`}
                className="text-purple-600 hover:text-purple-800 text-sm underline"
              >
                View Tournament #{game["tournament-id"]}
              </Link>
            </div>
            <p className="text-purple-600 text-sm mt-1">
              This game is part of an active tournament bracket
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Bet Amount: </span>
          <span>{formatStx(game["bet-amount"])} STX</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Player One: </span>
          <Link
            href={explorerAddress(game["player-one"])}
            target="_blank"
            className="hover:underline"
          >
            {abbreviateAddress(game["player-one"])}
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Player Two: </span>
          {game["player-two"] ? (
            <Link
              href={explorerAddress(game["player-two"])}
              target="_blank"
              className="hover:underline"
            >
              {abbreviateAddress(game["player-two"])}
            </Link>
          ) : (
            <span>Nobody</span>
          )}
        </div>

        {isJoinedAlready && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">You are playing as: </span>
            <span className="font-bold text-lg">{isPlayerOne ? "X" : "O"}</span>
          </div>
        )}

        {isJoinedAlready && !gameIsOver && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Current turn: </span>
            <span className="font-bold text-lg">
              {game["is-player-one-turn"] ? "X" : "O"}
              {isMyTurn && " (Your turn)"}
            </span>
          </div>
        )}

        {gameIsOver && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">
              {gameIsDraw ? "Result: " : "Winner: "}
            </span>
            {gameIsDraw ? (
              <span className="font-bold text-lg text-yellow-600">
                Draw/Tie Game - Funds Returned
              </span>
            ) : (
              <Link
                href={explorerAddress(game["winner"]!)}
                target="_blank"
                className="hover:underline"
              >
                {abbreviateAddress(game["winner"]!)}
                {game["winner"] === userData.profile.stxAddress.testnet &&
                  " (You won!)"}
              </Link>
            )}
          </div>
        )}
      </div>

      {isJoinable && (
        <button
          onClick={handleJoinGameWithLoading}
          disabled={playedMoveIndex === -1 || isJoining}
          className={`px-4 py-2 rounded ${
            playedMoveIndex === -1 || isJoining
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isJoining ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="32"
                  strokeDashoffset="32"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    dur="2s"
                    values="0 32;16 16;0 32;0 32"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    dur="2s"
                    values="0;-16;-32;-32"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              Joining...
            </span>
          ) : playedMoveIndex === -1 ? (
            "Select a cell first"
          ) : (
            "Join Game"
          )}
        </button>
      )}

      {isMyTurn && !gameIsOver && (
        <button
          onClick={handlePlayGameWithLoading}
          disabled={playedMoveIndex === -1 || isPlaying}
          className={`px-4 py-2 rounded ${
            playedMoveIndex === -1 || isPlaying
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isPlaying ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="32"
                  strokeDashoffset="32"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    dur="2s"
                    values="0 32;16 16;0 32;0 32"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    dur="2s"
                    values="0;-16;-32;-32"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              Playing...
            </span>
          ) : playedMoveIndex === -1 ? (
            "Select a cell first"
          ) : (
            "Play"
          )}
        </button>
      )}

      {isJoinedAlready && !isMyTurn && !gameIsOver && (
        <div className="text-gray-500">Waiting for opponent to play...</div>
      )}
    </div>
  );
}
