import {
  createNewGame,
  joinGame,
  Move,
  play,
  getAllGames,
} from "@/lib/contract";
import { getStxBalance } from "@/lib/stx-utils";
import { useNetwork } from "@/contexts/network-context";
import {
  AppConfig,
  showConnect,
  openContractCall,
  type UserData,
  UserSession,
} from "@stacks/connect";
import { PostConditionMode } from "@stacks/transactions";
import { useEffect, useState } from "react";

const appDetails = {
  name: "Tic Tac Toe",
  icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
};

const appConfig = new AppConfig(["store_write"]);
const userSession = new UserSession({ appConfig });

export function useStacks() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stxBalance, setStxBalance] = useState(0);
  const { networkType, network } = useNetwork();

  function connectWallet() {
    showConnect({
      appDetails,
      userSession,
      onFinish: () => {
        window.location.reload();
      },
    });
  }

  function disconnectWallet() {
    userSession.signUserOut();
    setUserData(null);
  }

  async function handleCreateGame(
    betAmount: number,
    moveIndex: number,
    move: Move,
    onSuccess?: (gameId: number) => void
  ) {
    if (typeof window === "undefined") return;
    if (moveIndex < 0 || moveIndex > 8) {
      window.alert("Invalid move. Please make a valid move.");
      return;
    }
    if (betAmount === 0) {
      window.alert("Please make a bet");
      return;
    }

    try {
      if (!userData) throw new Error("User not connected");
      const txOptions = await createNewGame(betAmount, moveIndex, move);
      await openContractCall({
        ...txOptions,
        appDetails,
        onFinish: async (data) => {
          window.alert("Sent create game transaction");

          // Wait a bit for the transaction to be processed, then get the latest game ID
          if (onSuccess) {
            setTimeout(async () => {
              try {
                const games = await getAllGames(network);
                const userAddress = userData.profile.stxAddress.testnet;
                // Find the most recent game created by this user
                const userCreatedGames = games.filter(
                  (game) =>
                    game["player-one"] === userAddress &&
                    game["player-two"] === null
                );
                if (userCreatedGames.length > 0) {
                  const latestGame = userCreatedGames.sort(
                    (a, b) => b.id - a.id
                  )[0];
                  onSuccess(latestGame.id);
                }
              } catch {
              }
            }, 3000); // Wait 3 seconds for transaction to be processed
          }
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (_err) {
      const err = _err as Error;
      window.alert(err.message);
    }
  }

  async function handleJoinGame(gameId: number, moveIndex: number, move: Move) {
    if (typeof window === "undefined") return;
    if (moveIndex < 0 || moveIndex > 8) {
      window.alert("Invalid move. Please make a valid move.");
      return;
    }

    try {
      if (!userData) throw new Error("User not connected");
      const txOptions = await joinGame(gameId, moveIndex, move);
      await openContractCall({
        ...txOptions,
        appDetails,
        onFinish: (data) => {
          window.alert("Sent join game transaction");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (_err) {
      const err = _err as Error;
      window.alert(err.message);
    }
  }

  async function handlePlayGame(gameId: number, moveIndex: number, move: Move) {
    if (typeof window === "undefined") return;
    if (moveIndex < 0 || moveIndex > 8) {
      window.alert("Invalid move. Please make a valid move.");
      return;
    }

    try {
      if (!userData) throw new Error("User not connected");
      const txOptions = await play(gameId, moveIndex, move);
      await openContractCall({
        ...txOptions,
        appDetails,
        onFinish: (data) => {
          window.alert("Sent play game transaction");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (_err) {
      const err = _err as Error;
      window.alert(err.message);
    }
  }

  useEffect(() => {
    try {
      if (userSession.isSignInPending()) {
        userSession.handlePendingSignIn().then((userData) => {
          setUserData(userData);
        });
      } else if (userSession.isUserSignedIn()) {
        setUserData(userSession.loadUserData());
      }
    } catch {
      // Clear incompatible session data from v8.x.x
      userSession.signUserOut();
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    if (userData) {
      // Always use testnet address since mainnet is not supported
      const address = userData.profile.stxAddress.testnet;
      getStxBalance(address, "testnet").then((balance) => {
        setStxBalance(balance);
      });
    }
  }, [userData]);

  return {
    userData,
    stxBalance,
    connectWallet,
    disconnectWallet,
    handleCreateGame,
    handleJoinGame,
    handlePlayGame,
    networkType,
    network,
  };
}
