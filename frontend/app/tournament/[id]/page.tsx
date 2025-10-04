"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTournament,
  getTournamentGames,
  type Tournament,
  type Game,
} from "@/lib/contract";
import Link from "next/link";
import { TournamentStatus } from "@/lib/contract";

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const tournamentId = parseInt(params.id as string);

  const loadTournamentData = useCallback(async () => {
    try {
      const [tournamentData, gamesData] = await Promise.all([
        getTournament(tournamentId),
        getTournamentGames(tournamentId),
      ]);

      if (!tournamentData) {
        router.push("/tournaments");
        return;
      }

      setTournament(tournamentData);
      setGames(gamesData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [tournamentId, router]);

  useEffect(() => {
    if (isNaN(tournamentId)) {
      router.push("/tournaments");
      return;
    }

    loadTournamentData();
  }, [tournamentId, router, loadTournamentData]);

  if (loading) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tournament Games</h1>
          <p className="text-gray-400">Loading tournament data...</p>
        </div>
      </section>
    );
  }

  if (!tournament) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tournament Not Found</h1>
          <Link
            href="/tournaments"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Back to Tournaments
          </Link>
        </div>
      </section>
    );
  }

  const getStatusText = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN:
        return "Registration Open";
      case TournamentStatus.IN_PROGRESS:
        return "Games Active";
      case TournamentStatus.COMPLETED:
        return "All Games Complete";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN:
        return "bg-green-600 text-green-100";
      case TournamentStatus.IN_PROGRESS:
        return "bg-blue-600 text-blue-100";
      case TournamentStatus.COMPLETED:
        return "bg-gray-600 text-gray-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  return (
    <section className="flex flex-col items-center py-20">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link
              href="/tournaments"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              ← Back to Tournaments
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Tournament #{tournament.id}
          </h1>
        </div>

        {/* Tournament Info Card */}
        <div className="mb-8 p-6 border border-gray-700 rounded-lg bg-gray-900">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Tournament Details</h2>
              <p className="text-gray-400">
                Created by {tournament.creator.slice(0, 10)}...
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                tournament.status
              )}`}
            >
              {getStatusText(tournament.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Entry Fee</p>
              <p className="text-xl font-bold text-white">
                {tournament["entry-fee"] / 1000000} STX
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
              <p className="text-xl font-bold text-white">
                {tournament["prize-pool"] / 1000000} STX
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Players</p>
              <p className="text-xl font-bold text-white">
                {tournament["current-players"]} / {tournament["max-players"]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Format</p>
              <p className="text-xl font-bold text-white">
                {tournament["max-players"]}-Player Multi-Game
              </p>
            </div>
          </div>

          {tournament.winner && (
            <div className="mt-4 p-4 bg-yellow-600 border border-yellow-500 rounded-lg">
              <p className="text-lg font-bold text-yellow-100">
                Winner: {tournament.winner.slice(0, 10)}...
              </p>
            </div>
          )}
      </div>

        {/* Tournament Games Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Tournament Games</h2>

          {games.length === 0 ? (
            <div className="text-center py-12 border border-gray-700 rounded-lg bg-gray-900">
              <p className="text-gray-500 mb-4">
                {tournament.status === TournamentStatus.OPEN
                  ? "Tournament hasn't started yet. All games will be created when the tournament starts."
                  : "No games found for this tournament."}
              </p>
              {tournament.status === TournamentStatus.OPEN && (
                <Link
                  href="/tournaments"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Back to Tournaments
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-600 p-4 rounded-lg">
                <p className="text-sm text-blue-100 font-medium">
                  Tournament Games ({games.length} matches)
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  Each game winner takes the prize for their match ({tournament["entry-fee"] / 1000000} STX per game)
                </p>
              </div>

              {/* Enhanced GamesList specifically for tournament context */}
              <div className="space-y-4">
                {games.map((game, index) => (
                  <div
                    key={game.id}
                    className="border border-gray-700 rounded-lg p-4 bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg text-white">
                        Match #{index + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          Game #{game.id}
                        </span>
                        {game.winner && (
                          <span className="px-2 py-1 bg-green-600 text-green-100 rounded-full text-xs font-medium">
                            Complete
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">
                        <p>
                          <strong className="text-white">Player 1 (X):</strong>{" "}
                          {game["player-one"].slice(0, 12)}...
                        </p>
                        <p>
                          <strong className="text-white">Player 2 (O):</strong>{" "}
                          {game["player-two"]?.slice(0, 12) || "Waiting..."}
                        </p>
                        {game.winner && (
                          <p className="font-semibold text-green-400 mt-2">
                            Winner: {game.winner.slice(0, 12)}...
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/game/${game.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        {game.winner ? "View Game" : "Play Game"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
