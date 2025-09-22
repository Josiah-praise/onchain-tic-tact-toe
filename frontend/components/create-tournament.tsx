"use client";

import { useState } from "react";

type CreateTournamentProps = {
  onCreateTournament: (entryFee: number, maxPlayers: number) => void;
  isCreating?: boolean;
};

export function CreateTournament({
  onCreateTournament,
  isCreating = false,
}: CreateTournamentProps) {
  const [entryFee, setEntryFee] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryFeeInMicroSTX = entryFee * 1000000; // Convert STX to microSTX
    onCreateTournament(entryFeeInMicroSTX, maxPlayers);
    setShowForm(false);
    // Reset form
    setEntryFee(1);
    setMaxPlayers(4);
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
    <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Create New Tournament</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700 mb-1">
            Entry Fee (STX)
          </label>
          <input
            type="number"
            id="entryFee"
            min="0.001"
            step="0.001"
            value={entryFee}
            onChange={(e) => setEntryFee(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum: 0.001 STX
          </p>
        </div>

        <div>
          <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-1">
            Tournament Size
          </label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={4}>4 Players (2 rounds)</option>
            <option value={8}>8 Players (3 rounds)</option>
            <option value={16}>16 Players (4 rounds)</option>
          </select>
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Prize Pool:</strong> {(entryFee * maxPlayers).toFixed(3)} STX
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Winner takes the entire prize pool
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create Tournament"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}