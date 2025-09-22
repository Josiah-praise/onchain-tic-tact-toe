"use client";

import { Tournament, TournamentStatus } from "@/lib/contract";

type TournamentCardProps = {
  tournament: Tournament;
  onJoin?: (tournamentId: number) => void;
  onStart?: (tournamentId: number) => void;
  isCreator?: boolean;
  canJoin?: boolean;
};

export function TournamentCard({
  tournament,
  onJoin,
  onStart,
  isCreator = false,
  canJoin = false,
}: TournamentCardProps) {
  const getStatusText = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN:
        return "Open for Registration";
      case TournamentStatus.IN_PROGRESS:
        return "In Progress";
      case TournamentStatus.COMPLETED:
        return "Completed";
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
    <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            Tournament #{tournament.id}
          </h3>
          <p className="text-sm text-gray-600">
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
          <p className="text-sm text-gray-600">Entry Fee</p>
          <p className="font-medium">{tournament["entry-fee"] / 1000000} STX</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Prize Pool</p>
          <p className="font-medium">{tournament["prize-pool"] / 1000000} STX</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Players</p>
          <p className="font-medium">
            {tournament["current-players"]} / {tournament["max-players"]}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Format</p>
          <p className="font-medium">{tournament["max-players"]}-Player Bracket</p>
        </div>
      </div>

      {tournament.winner && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-medium text-yellow-800">
            🏆 Winner: {tournament.winner.slice(0, 10)}...
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {canJoin && tournament.status === TournamentStatus.OPEN && !isFull && (
          <button
            onClick={() => onJoin?.(tournament.id)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Join Tournament
          </button>
        )}

        {canStartTournament && (
          <button
            onClick={() => onStart?.(tournament.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Start Tournament
          </button>
        )}

        {tournament.status === TournamentStatus.OPEN && isFull && !canStartTournament && (
          <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-center">
            Tournament Full
          </div>
        )}

        {tournament.status === TournamentStatus.IN_PROGRESS && (
          <button className="flex-1 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors">
            View Games
          </button>
        )}
      </div>
    </div>
  );
}