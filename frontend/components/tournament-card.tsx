"use client";

import { Tournament, TournamentStatus } from "@/lib/contract";
import Link from "next/link";

type TournamentCardProps = {
  tournament: Tournament;
  onJoin?: (tournamentId: number) => void;
  onStart?: (tournamentId: number) => void;
  isCreator?: boolean;
  canJoin?: boolean;
  isParticipating?: boolean;
};

export function TournamentCard({
  tournament,
  onJoin,
  onStart,
  isCreator = false,
  canJoin = false,
  isParticipating = false,
}: TournamentCardProps) {
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
        return "bg-green-100 text-green-800";
      case TournamentStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case TournamentStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isFull = tournament["current-players"] >= tournament["max-players"];
  const canStartTournament =
    isCreator &&
    tournament.status === TournamentStatus.OPEN &&
    tournament["current-players"] === tournament["max-players"];

  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900 hover:bg-gray-800 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Tournament #{tournament.id}</h3>
          <p className="text-sm text-gray-400">
            Created by {tournament.creator.slice(0, 10)}...
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            tournament.status
          )}`}
        >
          {getStatusText(tournament.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400">Entry Fee</p>
          <p className="font-medium text-white">{tournament["entry-fee"] / 1000000} STX</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Prize Pool</p>
          <p className="font-medium text-white">
            {tournament["prize-pool"] / 1000000} STX
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Players</p>
          <p className="font-medium text-white">
            {tournament["current-players"]} / {tournament["max-players"]}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Format</p>
          <p className="font-medium text-white">
            {tournament["max-players"]}-Player Multi-Game
          </p>
        </div>
      </div>

      {tournament.winner && (
        <div className="mb-4 p-3 bg-yellow-600 border border-yellow-500 rounded">
          <p className="text-sm font-medium text-yellow-100">
            Winner: {tournament.winner.slice(0, 10)}...
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {/* Join button - only show for non-creators who aren't already participating */}
        {canJoin && tournament.status === TournamentStatus.OPEN && !isFull && (
          <button
            onClick={() => onJoin?.(tournament.id)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Join Tournament
          </button>
        )}

        {/* Already joined - show for participants (not creators) only when tournament is NOT full */}
        {!isCreator && isParticipating && tournament.status === TournamentStatus.OPEN && !isFull && (
          <div className="flex-1 px-4 py-2 bg-green-600 text-green-100 rounded-lg text-center font-medium">
            Joined
          </div>
        )}

        {/* Start button for creators when tournament is full */}
        {canStartTournament && (
          <button
            onClick={() => onStart?.(tournament.id)}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Start Tournament
          </button>
        )}

        {/* Tournament full message - show for everyone except creators when tournament is full */}
        {tournament.status === TournamentStatus.OPEN &&
          isFull &&
          !canStartTournament && (
            <div className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-center font-medium">
              Tournament Full
            </div>
          )}

        {/* View games/tournament links */}
        {tournament.status === TournamentStatus.IN_PROGRESS && (
          <Link
            href={`/tournament/${tournament.id}`}
            className="flex-1 px-4 py-2 bg-blue-600 text-blue-100 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
          >
            View Games
          </Link>
        )}

        {tournament.status === TournamentStatus.COMPLETED && (
          <Link
            href={`/tournament/${tournament.id}`}
            className="flex-1 px-4 py-2 bg-gray-600 text-gray-100 rounded-lg hover:bg-gray-700 transition-colors text-center font-medium"
          >
            View Tournament
          </Link>
        )}
      </div>
    </div>
  );
}
