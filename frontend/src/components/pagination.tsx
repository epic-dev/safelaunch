interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPage?: number;
}
export const Pagination = ({ currentPage, totalPages, totalItems, onPageChange, onItemsPerPageChange, itemsPerPage = 10 }: PaginationProps) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(event.target.value, 10);
    onPageChange(1);
    onItemsPerPageChange(newItemsPerPage);
  };

  return (
    <div className="flex justify-between items-center px-4 py-3 bg-surface-container-low border-t border-border-subtle">
      <span className="font-body-md text-body-md text-on-surface-variant text-[13px]">
        {`Showing ${1 + (currentPage - 1) * itemsPerPage}-${Math.min(totalItems, itemsPerPage * currentPage)} of ${totalItems} flag(-s)`}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-panel-bg text-on-surface-variant hover:not-disabled:text-on-surface hover:not-disabled:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-panel-bg text-on-surface-variant hover:not-disabled:text-on-surface hover:not-disabled:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>

        <select
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="ml-4 px-2 py-1 border border-border-subtle rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors bg-panel-bg"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
  );
};
