"use client";

import { Game, isGameOver, isGameDraw } from "@/lib/contract";
import Link from "next/link";
import { GameBoard } from "./game-board";
import { useStacks } from "@/hooks/use-stacks";
import { useMemo } from "react";
import { formatStx } from "@/lib/stx-utils";

export function GamesList({ games }: { games: Game[] }) {
  const { userData } = useStacks();

  // User Games are games in which the user is a player
  // This includes: games you created (waiting for opponent) and active games where you're playing
  const userGames = useMemo(() => {
    if (!userData) return [];
    const userAddress = userData.profile.stxAddress.testnet;
    const filteredGames = games.filter(
      (game) =>
        (game["player-one"] === userAddress ||
          game["player-two"] === userAddress) &&
        !isGameOver(game) // Game is not over (no winner or tie)
    );
    return filteredGames;
  }, [userData, games]);

  // Joinable games are games in which there still isn't a second player
  // and also the currently logged in user is not the creator of the game
  const joinableGames = useMemo(() => {
    if (!userData) return [];
    const userAddress = userData.profile.stxAddress.testnet;

    return games.filter(
      (game) =>
        !isGameOver(game) &&
        game["player-one"] !== userAddress &&
        game["player-two"] === null
    );
  }, [games, userData]);

  // Ended games are games in which the winner has been decided or it's a tie
  const endedGames = useMemo(() => {
    return games.filter((game) => isGameOver(game));
  }, [games]);

  return (
    <div className="w-full max-w-4xl space-y-12">
      {userData ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Games</h2>
          {userGames.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-gray-500 mb-4">
                You don&apos;t have any active games
              </p>
              <Link
                href="/create"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create New Game
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-8 max-w-7xl overflow-y-scroll">
              {userGames.map((game, index) => {
                const waitingForPlayer = game["player-two"] === null;
                return (
                  <Link
                    key={`your-game-${index}`}
                    href={`/game/${game.id}`}
                    className="shrink-0 flex flex-col gap-2 border p-4 rounded-md border-gray-700 bg-gray-900 w-fit"
                  >
                    <GameBoard
                      key={index}
                      board={game.board}
                      cellClassName="size-8 text-xl"
                    />
                    {/* Tournament Badge */}
                    {game["tournament-id"] !== null && (
                      <div className="text-xs px-2 py-1 bg-purple-600 text-purple-100 rounded text-center w-full font-medium">
                        Tournament #{game["tournament-id"]}
                      </div>
                    )}
                    <div className="text-md px-1 py-0.5 bg-gray-800 rounded text-center w-full">
                      {formatStx(game["bet-amount"])} STX
                    </div>
                    <div
                      className={`text-md px-1 py-0.5 rounded text-center w-full ${
                        waitingForPlayer
                          ? "bg-yellow-600 text-yellow-100"
                          : "bg-gray-800"
                      }`}
                    >
                      {waitingForPlayer
                        ? "Waiting for opponent"
                        : `Next Turn: ${
                            game["is-player-one-turn"] ? "X" : "O"
                          }`}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div>
        <h2 className="text-2xl font-bold mb-4">Joinable Games</h2>
        {joinableGames.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-500 mb-4">
              No joinable games found. Do you want to create a new one?
            </p>
            <Link
              href="/create"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create New Game
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-8 max-w-7xl overflow-y-scroll">
            {joinableGames.map((game, index) => (
              <Link
                key={`joinable-game-${index}`}
                href={`/game/${game.id}`}
                className="shrink-0 flex flex-col gap-2 border p-4 rounded-md border-gray-700 bg-gray-900 w-fit"
              >
                <GameBoard
                  key={index}
                  board={game.board}
                  cellClassName="size-8 text-xl"
                />
                {/* Tournament Badge */}
                {game["tournament-id"] !== null && (
                  <div className="text-xs px-2 py-1 bg-purple-600 text-purple-100 rounded text-center w-full font-medium">
                    🏆 Tournament #{game["tournament-id"]}
                  </div>
                )}
                <div className="text-md px-1 py-0.5 bg-gray-800 rounded text-center w-full">
                  {formatStx(game["bet-amount"])} STX
                </div>
                <div className="text-md px-1 py-0.5 bg-gray-800 rounded text-center w-full">
                  Next Turn: {game["is-player-one-turn"] ? "X" : "O"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Ended Games</h2>
        {endedGames.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-500 mb-4">
              No ended games yet. Do you want to create a new one?
            </p>
            <Link
              href="/create"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create New Game
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-8 max-w-7xl overflow-y-scroll">
            {endedGames.map((game, index) => {
              if (!userData) return null;

              const userAddress = userData.profile.stxAddress.testnet;
              const isUserPlayerOne = game["player-one"] === userAddress;
              const isUserPlayerTwo = game["player-two"] === userAddress;
              const isUserInGame = isUserPlayerOne || isUserPlayerTwo;

              // Determine the result text based on game outcome
              let resultText = "";
              let resultColor = "";

              if (game.winner === null) {
                // Winner is null - this should be treated as a tie
                resultText = "Result: Tie";
                resultColor = "bg-yellow-600 text-yellow-100";
              } else if (isGameDraw(game)) {
                resultText = "Result: Tie";
                resultColor = "bg-yellow-600 text-yellow-100";
              } else if (isUserInGame) {
                // Check if the user won
                const userWon = game.winner === userAddress;
                if (userWon) {
                  resultText = "Winner: You";
                  resultColor = "bg-green-600 text-green-100";
                } else {
                  // User lost - show opponent's mark
                  const opponentMark = isUserPlayerOne ? "O" : "X";
                  resultText = `Winner: ${opponentMark}`;
                  resultColor = "bg-red-600 text-red-100";
                }
              } else {
                // User not in game - show winner's mark
                const winnerIsPlayerOne = game.winner === game["player-one"];
                resultText = `Winner: ${winnerIsPlayerOne ? "X" : "O"}`;
                resultColor = "bg-gray-600";
              }

              return (
                <Link
                  key={`ended-game-${index}`}
                  href={`/game/${game.id}`}
                  className="shrink-0 flex flex-col gap-2 border p-4 rounded-md border-gray-700 bg-gray-900 w-fit"
                >
                  <GameBoard
                    key={index}
                    board={game.board}
                    cellClassName="size-8 text-xl"
                  />
                  {/* Tournament Badge */}
                  {game["tournament-id"] !== null && (
                    <div className="text-xs px-2 py-1 bg-purple-600 text-purple-100 rounded text-center w-full font-medium">
                      🏆 Tournament #{game["tournament-id"]}
                    </div>
                  )}
                  <div className="text-md px-1 py-0.5 bg-gray-800 rounded text-center w-full">
                    {formatStx(game["bet-amount"])} STX
                  </div>
                  <div
                    className={`text-md px-1 py-0.5 rounded text-center w-full ${resultColor}`}
                  >
                    {resultText}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
