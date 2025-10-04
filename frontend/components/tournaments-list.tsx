"use client";

import { Tournament } from "@/lib/contract";
import { TournamentCard } from "./tournament-card";

type TournamentWithParticipation = Tournament & {
  isUserParticipating: boolean;
};

type TournamentsListProps = {
  tournaments: TournamentWithParticipation[];
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
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-lg font-medium text-white mb-2">
          No tournaments found
        </h3>
        <p className="text-gray-500 mb-6">
          Be the first to create a tournament and challenge other players!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">Available Tournaments</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => {
        const isCreator = userAddress === tournament.creator;
        const isParticipating = tournament.isUserParticipating;

        // User can join if:
        // 1. They are connected (userAddress exists)
        // 2. They are NOT the creator
        // 3. They are NOT already participating
        const canJoin = userAddress && !isCreator && !isParticipating;

        return (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            onJoin={onJoinTournament}
            onStart={onStartTournament}
            isCreator={isCreator}
            canJoin={!!canJoin}
            isParticipating={isParticipating}
          />
        );
      })}
      </div>
    </div>
  );
}