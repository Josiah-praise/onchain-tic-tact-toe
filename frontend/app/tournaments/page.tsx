"use client";

import { useState, useEffect, useCallback } from "react";
import { openContractCall } from "@stacks/connect";
import { PostConditionMode } from "@stacks/transactions";
import {
  getAllTournaments,
  createTournament,
  joinTournament,
  startTournament,
  isUserInTournament,
  type Tournament,
} from "@/lib/contract";
import { useStacks } from "@/hooks/use-stacks";
import { TournamentsList } from "@/components/tournaments-list";
import { CreateTournament } from "@/components/create-tournament";

export const dynamic = "force-dynamic";

type TournamentWithParticipation = Tournament & {
  isUserParticipating: boolean;
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentWithParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { userData, network } = useStacks();

  const appDetails = {
    name: "Tic Tac Toe",
    icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
  };

  const loadTournaments = useCallback(async () => {

    try {
      const tournamentData = await getAllTournaments(network);

      // Check user participation for each tournament if user is connected
      const tournamentsWithParticipation: TournamentWithParticipation[] = await Promise.all(
        tournamentData.map(async (tournament) => {
          let isUserParticipating = false;

          if (userData?.profile.stxAddress.testnet) {
            try {
              isUserParticipating = await isUserInTournament(
                tournament.id,
                userData.profile.stxAddress.testnet,
                tournament["max-players"],
                network
              );
            } catch {
            }
          }

          return {
            ...tournament,
            isUserParticipating,
          };
        })
      );


      setTournaments(tournamentsWithParticipation);
    } catch {
      setLoading(false);
    }
  }, [userData, network]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleCreateTournament = async (
    entryFee: number,
    maxPlayers: number
  ): Promise<boolean> => {
    if (!userData) {
      alert("Please connect your wallet first");
      return false;
    }


    setCreating(true);

    try {
      const txOptions = await createTournament(entryFee, maxPlayers);

      return new Promise<boolean>((resolve) => {
        openContractCall({
          ...txOptions,
          network,
          appDetails,
          postConditionMode: PostConditionMode.Allow,
          onFinish: () => {

            // Reload tournaments after a short delay to see the new tournament
            setTimeout(() => {
              loadTournaments()
                .then(() => {
                  setCreating(false);
                  resolve(true);
                })
                .catch(() => {
                  setCreating(false);
                  resolve(true);
                });
            }, 5000);
          },
          onCancel: () => {
            setCreating(false);
            resolve(false);
          },
        }).catch(() => {
          setCreating(false);
          resolve(false);
        });
      });
    } catch (error) {
      alert(`Failed to create tournament: ${error}`);
      setCreating(false);
      return false;
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
        network,
        appDetails,
        postConditionMode: PostConditionMode.Allow,
        onFinish: () => {
          setTimeout(loadTournaments, 3000);
        },
        onCancel: () => {
        },
      });
    } catch {
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
        network,
        appDetails,
        postConditionMode: PostConditionMode.Allow,
        onFinish: () => {
          setTimeout(loadTournaments, 3000);
        },
        onCancel: () => {
        },
      });
    } catch {
      alert("Failed to start tournament");
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tournaments</h1>
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center py-20">
      <div className="text-center mb-20">
        <h1 className="text-4xl font-bold mb-4">Tournaments</h1>
        <p className="text-sm text-gray-500 mb-8">
          Join tournaments where multiple games are played simultaneously for individual prizes
        </p>
      </div>

      <div className="w-full max-w-6xl">
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
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-500 mb-4">
              Connect your wallet to create and join tournaments
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
