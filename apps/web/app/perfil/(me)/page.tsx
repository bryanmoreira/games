import { SudokuRecords } from "@/components/profile/SudokuRecords";

export default function ProfileSummary() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm text-white/80">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
          </svg>
          SUDOKU
        </h2>
        <SudokuRecords />
      </div>
    </div>
  );
}
