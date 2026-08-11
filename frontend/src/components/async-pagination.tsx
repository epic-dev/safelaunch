import { use } from "react";
import { Pagination } from "./pagination";

interface AsyncPaginationProps {
    dataPromise: Promise<{ total: number }>;
    currentPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (value: number) => void;
    pageSize: number;
}
export const AsyncPagination = ({ dataPromise, currentPage, pageSize, onPageChange, onItemsPerPageChange }: AsyncPaginationProps) => {
    const { total } = use(dataPromise)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
            itemsPerPage={pageSize}
        />
    )
}