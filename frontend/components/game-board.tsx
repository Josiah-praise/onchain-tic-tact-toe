"use client";

import { Move } from "@/lib/contract";

type GameBoardProps = {
  board: Move[];
  onCellClick?: (index: number) => void;
  cellClassName?: string;
  nextMove?: Move;
  disabled?: boolean;
  winningPattern?: number[]; // Array of indices that form the winning pattern
};

export function GameBoard({
  board,
  onCellClick,
  nextMove,
  cellClassName,
  disabled = false,
  winningPattern = [],
}: GameBoardProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => {
          const isWinningCell = winningPattern.includes(index);
          const baseClasses =
            "border border-gray-600 rounded-md flex items-center justify-center font-bold group";
          const disabledClasses =
            disabled || cell !== Move.EMPTY
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer";
          const winningClasses = isWinningCell
            ? "bg-green-200 border-green-500 border-2 animate-pulse"
            : "";

          return (
            <div
              key={index}
              className={`${baseClasses} ${disabledClasses} ${winningClasses} ${cellClassName}`}
              onClick={() =>
                !disabled && cell === Move.EMPTY && onCellClick?.(index)
              }
            >
              {cell === Move.EMPTY ? (
                <span
                  className={`text-gray-500 ${
                    disabled ? "hidden" : "hidden group-hover:block"
                  }`}
                >
                  {nextMove === Move.X ? "X" : nextMove === Move.O ? "O" : ""}
                </span>
              ) : (
                <span
                  className={
                    isWinningCell ? "text-green-800 font-extrabold" : ""
                  }
                >
                  {cell === Move.X ? "X" : cell === Move.O ? "O" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
