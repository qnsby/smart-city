interface PaginationProps {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, hasPrev, hasNext, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-6 pt-6 text-[16px] text-[#2B2B2B]">
      <button
        type="button"
        disabled={!hasPrev}
        onClick={onPrev}
        className="rounded-full bg-[#FFFFFF] px-5 py-2 transition hover:bg-[#F2F5F8] disabled:opacity-40"
      >
        Previous
      </button>

      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2E2E5A]/12 font-medium text-[#2E2E5A] shadow-sm">
        {page}
      </span>

      <button
        type="button"
        disabled={!hasNext}
        onClick={onNext}
        className="rounded-full bg-[#FFFFFF] px-5 py-2 transition hover:bg-[#F2F5F8] disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
