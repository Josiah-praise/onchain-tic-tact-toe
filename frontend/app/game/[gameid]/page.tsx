"use client";

import { PlayGame } from "@/components/play-game";
import { getGame, Game } from "@/lib/contract";
import { useNetwork } from "@/contexts/network-context";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

export default function GamePage() {
  const params = useParams();
  const { network } = useNetwork();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const gameId = Array.isArray(params.gameid) ? params.gameid[0] : params.gameid;

  const fetchGame = useCallback(async () => {
    if (!gameId) return;

    try {
      // Ensure gameId is a valid integer
      const gameIdNumber = Math.floor(Number(gameId));
      if (isNaN(gameIdNumber) || gameIdNumber < 0) {
        throw new Error("Invalid game ID");
      }

      const fetchedGame = await getGame(gameIdNumber, network);
      if (!fetchedGame) {
        setError("Game not found");
      } else {
        setGame(fetchedGame);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching game:", err);
      setError(err instanceof Error ? err.message : "Failed to load game");
    }
  }, [gameId, network]);

  async function refreshGame() {
    setRefreshing(true);
    await fetchGame();
    setRefreshing(false);
  }

  useEffect(() => {
    async function initialFetch() {
      setLoading(true);
      await fetchGame();
      setLoading(false);
    }

    initialFetch();
  }, [fetchGame]);

  // Auto-refresh game data every 5 seconds to sync with blockchain state
  useEffect(() => {
    if (!gameId || !game) return;

    const interval = setInterval(async () => {
      await fetchGame();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [gameId, game, fetchGame]);

  if (loading) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center">Loading game...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center text-red-500">{error}</div>
      </section>
    );
  }

  if (!game) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center">Game not found</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center py-20">
      <div className="text-center mb-20">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl font-bold">Game #{gameId}</h1>
          <button
            onClick={refreshGame}
            disabled={refreshing}
            className={`px-3 py-1 rounded text-sm ${
              refreshing
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <span className="text-sm text-gray-500">
          Play the game with your opponent (Auto-refreshes every 5 seconds)
        </span>
      </div>

      <PlayGame game={game} />
    </section>
  );
}
