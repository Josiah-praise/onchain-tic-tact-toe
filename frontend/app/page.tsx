"use client";

import Link from "next/link";
import { GamesList } from "@/components/games-list";
import { getAllGames } from "@/lib/contract";
import { useNetwork } from "@/contexts/network-context";
import { useEffect, useState } from "react";
import { Game } from "@/lib/contract";

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { network } = useNetwork();

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      try {
        const fetchedGames = await getAllGames(network);
        setGames(fetchedGames);
      } catch {
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [network]);

  return (
    <section className="flex flex-col items-center py-20">
      <div className="text-center mb-20">
        <h1 className="text-4xl font-bold mb-4">Tic Tac Toe</h1>
        <p className="text-sm text-gray-500 mb-8">
          Play 1v1 Tic Tac Toe on the Stacks blockchain
        </p>

        <div className="flex gap-4 justify-center mb-8">
          <Link
            href="/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Game
          </Link>
          <Link
            href="/tournaments"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Join Tournament
          </Link>
        </div>
      </div>

      <div className="w-full max-w-6xl">
        <h2 className="text-2xl font-bold text-center mb-8">Active Games</h2>
        {loading ? (
          <div className="text-center">Loading games...</div>
        ) : (
          <GamesList games={games} />
        )}
      </div>
    </section>
  );
}
