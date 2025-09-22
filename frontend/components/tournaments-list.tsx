"use client";

import { Tournament } from "@/lib/contract";
import { TournamentCard } from "./tournament-card";

type TournamentsListProps = {
  tournaments: Tournament[];
  userAddress?: string;
  onJoinTournament?: (tournamentId: number) => void;
  onStartTournament?: (tournamentId: number) => void;
};

export function TournamentsList({
  tournaments,
  userAddress,
  onJoinTournament,
  onStartTournament,
}: TournamentsListProps) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No tournaments found
        </h3>
        <p className="text-gray-600 mb-6">
          Be the first to create a tournament and challenge other players!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => {
        const isCreator = userAddress === tournament.creator;
        const canJoin = userAddress && !isCreator;

        return (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            onJoin={onJoinTournament}
            onStart={onStartTournament}
            isCreator={isCreator}
            canJoin={!!canJoin}
          />
        );
      })}
    </div>
  );
}