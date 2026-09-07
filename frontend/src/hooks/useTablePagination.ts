import { useEffect, useMemo, useState } from "react";

export const TABLE_PAGE_SIZE = 10;

export function useTablePagination<T>(rows: T[], pageSize = TABLE_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  return { page, setPage, pageRows, pageSize, totalPages };
}
