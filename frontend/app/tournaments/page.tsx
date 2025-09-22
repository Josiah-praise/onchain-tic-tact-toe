"use client";

import { useState, useEffect } from "react";
import { openContractCall } from "@stacks/connect";
import { getAllTournaments, createTournament, joinTournament, startTournament, type Tournament } from "@/lib/contract";
import { useStacks } from "@/hooks/use-stacks";
import { TournamentsList } from "@/components/tournaments-list";
import { CreateTournament } from "@/components/create-tournament";

export const dynamic = "force-dynamic";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { userData } = useStacks();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const tournamentData = await getAllTournaments();
      setTournaments(tournamentData);
    } catch (error) {
      console.error("Error loading tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (entryFee: number, maxPlayers: number) => {
    if (!userData) {
      alert("Please connect your wallet first");
      return;
    }

    setCreating(true);
    try {
      const txOptions = await createTournament(entryFee, maxPlayers);

      await openContractCall({
        ...txOptions,
        onFinish: () => {
          console.log("Tournament creation transaction submitted");
          // Reload tournaments after a short delay to see the new tournament
          setTimeout(loadTournaments, 3000);
        },
        onCancel: () => {
          console.log("Tournament creation cancelled");
        },
      });
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Failed to create tournament");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    if (!userData) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const txOptions = await joinTournament(tournamentId);

      await openContractCall({
        ...txOptions,
        onFinish: () => {
          console.log("Tournament join transaction submitted");
          // Reload tournaments after a short delay
          setTimeout(loadTournaments, 3000);
        },
        onCancel: () => {
          console.log("Tournament join cancelled");
        },
      });
    } catch (error) {
      console.error("Error joining tournament:", error);
      alert("Failed to join tournament");
    }
  };

  const handleStartTournament = async (tournamentId: number) => {
    if (!userData) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const txOptions = await startTournament(tournamentId);

      await openContractCall({
        ...txOptions,
        onFinish: () => {
          console.log("Tournament start transaction submitted");
          // Reload tournaments after a short delay
          setTimeout(loadTournaments, 3000);
        },
        onCancel: () => {
          console.log("Tournament start cancelled");
        },
      });
    } catch (error) {
      console.error("Error starting tournament:", error);
      alert("Failed to start tournament");
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tournaments 🏆</h1>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Tournaments 🏆</h1>
        <p className="text-gray-600 mb-8">
          Compete in bracket-style tournaments for bigger prizes
        </p>
      </div>

      {userData && (
        <CreateTournament
          onCreateTournament={handleCreateTournament}
          isCreating={creating}
        />
      )}

      <TournamentsList
        tournaments={tournaments}
        userAddress={userData?.profile.stxAddress.testnet}
        onJoinTournament={handleJoinTournament}
        onStartTournament={handleStartTournament}
      />

      {!userData && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            Connect your wallet to create and join tournaments
          </p>
        </div>
      )}
    </section>
  );
}