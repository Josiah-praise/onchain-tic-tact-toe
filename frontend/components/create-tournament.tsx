"use client";

import { useState } from "react";

type CreateTournamentProps = {
  onCreateTournament: (
    entryFee: number,
    maxPlayers: number
  ) => Promise<boolean>;
  isCreating?: boolean;
};

export function CreateTournament({
  onCreateTournament,
  isCreating = false,
}: CreateTournamentProps) {
  const [entryFee, setEntryFee] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate entryFee
    if (!entryFee || entryFee < 0.001) {
      setError("Entry fee must be at least 0.001 STX");
      return;
    }

    try {
      const entryFeeInMicroSTX = entryFee * 1000000; // Convert STX to microSTX
      const success = await onCreateTournament(entryFeeInMicroSTX, maxPlayers);

      if (success) {
        // Reset form and close on success
        setShowForm(false);
        setEntryFee(1);
        setMaxPlayers(4);
        setError(null);
      } else {
        setError("Failed to create tournament. Please try again.");
      }
    } catch {
      setError("An error occurred while creating the tournament.");
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Create New Tournament
      </button>
    );
  }

  return (
    <div className="mb-6 p-6 border border-gray-700 rounded-lg bg-gray-900">
      <h3 className="text-lg font-semibold mb-4 text-gray-100">
        Create New Tournament
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 p-3 rounded-md">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="entryFee"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Entry Fee (STX)
          </label>
          <input
            type="number"
            id="entryFee"
            min="0.001"
            step="0.001"
            value={entryFee || ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setEntryFee(isNaN(value) ? 0 : value);
              setError(null); // Clear error when user types
            }}
            disabled={isCreating}
            className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Minimum: 0.001 STX</p>
        </div>

        <div>
          <label
            htmlFor="maxPlayers"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Tournament Size
          </label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
            disabled={isCreating}
            className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={4}>4 Players (2 rounds)</option>
            <option value={8}>8 Players (3 rounds)</option>
            <option value={16}>16 Players (4 rounds)</option>
          </select>
        </div>

        <div className="bg-blue-900/30 border border-blue-700/50 p-3 rounded-md">
          <p className="text-sm text-blue-200">
            <strong>Total Entry Fees:</strong>{" "}
            {((entryFee || 0) * maxPlayers).toFixed(3)} STX
          </p>
          <p className="text-xs text-blue-300 mt-1">
            Each game winner takes {entryFee?.toFixed(3)} STX for their match
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isCreating || !entryFee || entryFee < 0.001}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCreating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Tournament...
              </>
            ) : (
              "Create Tournament"
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={isCreating}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
