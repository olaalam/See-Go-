"use client";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash, Plus, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function DataTable({
  data,
  columns,
  addRoute,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
  showAddButton = true,
  showDeleteButtonInHeader = false,
  onDeleteInHeader,
  showRowSelection = false,
  showFilter = true,
  showActions = true,
  showEditButton = true,
  showDeleteButton = true,
  searchKeys = [],
  onAddClick,
  filterOptions = [],
  initialPage = 1,
  defaultAddSubscriberType = null,
  // ***** Props الترقيم من الباك إند *****
  isBackendPagination = false,
  currentPage: controlledCurrentPage,
  totalPages: controlledTotalPages,
  totalCount,
  onPageChange,
  onSearchChange,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState(() => {
    const initialFilters = {};
    filterOptions.forEach((group) => {
      initialFilters[group.key] = "all";
    });
    return initialFilters;
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const navigate = useNavigate();

  // الحالة للترقيم الداخلي (Client-side)
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(Math.max(1, initialPage));
  }, [initialPage]);

  const getNestedValue = (obj, path) => {
    return path
      .split(".")
      .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };

  const filteredData = useMemo(() => {
    // إذا كنا في وضع الباك إند، نرجع البيانات كما هي بدون فلترة داخلية
    if (isBackendPagination) return data;

    let currentData = data;

    if (searchValue) {
      const lowerCaseSearchValue = searchValue.toLowerCase();
      currentData = currentData.filter((row) => {
        const matches = searchKeys.some((key) => {
          const value = getNestedValue(row, key);
          if (value === null || value === undefined || typeof value === "object") {
            return false;
          }
          const searchableString = String(value).toLowerCase();
          return searchableString.includes(lowerCaseSearchValue);
        });
        return matches;
      });
    }

    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue !== "all") {
        currentData = currentData.filter((row) => {
          const rowValue = getNestedValue(row, filterKey);
          const comparableRowValue =
            rowValue !== null && rowValue !== undefined
              ? String(rowValue).toLowerCase()
              : "";
          const comparableFilterValue = String(filterValue).toLowerCase();

          return comparableRowValue === comparableFilterValue;
        });
      }
    });

    return currentData;
  }, [data, searchValue, activeFilters, searchKeys, isBackendPagination]);
  const getPaginationItems = (current, total) => {
    const delta = 2; // عدد الصفحات التي تظهر حول الصفحة الحالية
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };
  // --- منطق الترقيم ---
  const totalPagesLocal = Math.ceil(filteredData.length / itemsPerPage);

  // حساب الصفحة الحالية لغرض العرض
  const displayCurrentPage = isBackendPagination ? (controlledCurrentPage || 1) : currentPage;

  // تحديد الـ startIndex لترقيم الصفوف
  const startIndex = (displayCurrentPage - 1) * itemsPerPage;

  // البيانات المعروضة
  const paginatedData = isBackendPagination ? data : filteredData.slice(startIndex, startIndex + itemsPerPage);

  // تحديثات العرض بناءً على وضع الترقيم
  const displayTotalPages = isBackendPagination ? (controlledTotalPages || 1) : totalPagesLocal;
  const displayTotalCount = isBackendPagination ? totalCount : filteredData.length;

  useEffect(() => {
    if (!isBackendPagination && currentPage > totalPagesLocal && totalPagesLocal > 0) {
      setCurrentPage(totalPagesLocal);
    } else if (!isBackendPagination && totalPagesLocal === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPagesLocal, filteredData.length, isBackendPagination]);

  const handlePageChange = (page) => {
    if (isBackendPagination) {
      onPageChange?.(page);
    } else {
      if (page >= 1 && page <= totalPagesLocal) {
        setCurrentPage(page);
      }
    }
  };

  const handleRowSelect = (row) => {
    setSelectedRows((prev) =>
      prev.includes(row.id)
        ? prev.filter((id) => id !== row.id)
        : [...prev, row.id]
    );
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedRows(paginatedData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleAccordionFilterChange = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
    if (!isBackendPagination) setCurrentPage(1);
  };

  return (
    <div className="w-full !p-3 space-y-6">
      <div className="flex justify-between !mb-6 items-center flex-wrap gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search..."
            className="w-full md:!ms-3 sm:!ms-0 !ps-3 sm:w-64 max-w-sm border-bg-primary focus:border-bg-primary focus:ring-bg-primary rounded-[10px]"
            value={searchValue}
            onChange={(e) => {
              const val = e.target.value;
              setSearchValue(val);
              if (isBackendPagination) {
                onSearchChange?.(val);
              } else {
                setCurrentPage(1);
              }
            }}
          />
          <span className="text-sm font-semibold text-bg-primary whitespace-nowrap">
            Total: {displayTotalCount}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {showFilter && filterOptions.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {filterOptions.map((group) => (
                <div key={group.key} className="w-[150px]">
                  <Select
                    value={activeFilters[group.key]}
                    onValueChange={(val) =>
                      handleAccordionFilterChange(group.key, val)
                    }
                  >
                    <SelectTrigger className="text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                      <SelectValue placeholder={group.label} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                      {group.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          className="text-bg-primary"
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {showAddButton && (
            <Button
              onClick={() => {
                if (onAddClick) {
                  onAddClick();
                } else if (onAdd) {
                  onAdd();
                } else if (addRoute) {
                  navigate(addRoute, { state: { initialType: defaultAddSubscriberType } });
                }
              }}
              className="bg-bg-primary cursor-pointer text-white hover:bg-teal-700 rounded-[10px] !p-3"
            >
              <Plus className="w-5 h-5 !mr-2" />
              Add
            </Button>
          )}

          {showDeleteButtonInHeader && (
            <Button
              onClick={() => onDeleteInHeader(selectedRows)}
              className="bg-red-600 cursor-pointer text-white hover:bg-red-700 rounded-[10px] !p-3"
              disabled={selectedRows.length === 0}
            >
              <Trash className="w-5 h-5 !mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-[calc(100vh-300px)]">
        <Table className="!min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-bg-primary font-semibold w-12">
                #
              </TableHead>
              {showRowSelection && (
                <TableHead className="text-bg-primary font-semibold w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-bg-primary border-gray-300 rounded focus:ring-bg-primary"
                  />
                </TableHead>
              )}
              {columns.map((col, index) => (
                <TableHead
                  key={index}
                  className="text-bg-primary font-semibold"
                >
                  {col.label}
                </TableHead>
              ))}
              {(showEditButton || showDeleteButton || showActions) && (
                <TableHead className="text-bg-primary font-semibold">
                  Action
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow key={row.id || index}>
                  <TableCell className="!px-2 !py-1 text-sm">
                    {startIndex + index + 1}
                  </TableCell>
                  {showRowSelection && (
                    <TableCell className="!px-2 !py-1">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(row);
                        }}
                        className="w-4 h-4 text-bg-primary border-gray-300 rounded focus:ring-bg-primary"
                      />
                    </TableCell>
                  )}
                  {columns.map((col, idx) => (
                    <TableCell
                      key={idx}
                      className={clsx(
                        "!px-2 !py-1 text-sm whitespace-normal break-words",
                        col.key === "img" &&
                        "h-full min-h-[60px] flex justify-center items-center"
                      )}
                    >
                      {col.key === "status" ? (
                        <div className="flex justify-center items-center gap-2">
                          <Switch
                            checked={
                              String(
                                getNestedValue(row, col.key)
                              )?.toLowerCase() === "active"
                            }
                            onCheckedChange={(checked) =>
                              onToggleStatus?.(row, checked ? 1 : 0)
                            }
                            className={clsx(
                              "relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none",
                              String(
                                getNestedValue(row, col.key)
                              )?.toLowerCase() === "active"
                                ? "bg-bg-primary"
                                : "bg-gray-300"
                            )}
                          >
                            <span
                              className={clsx(
                                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                                String(
                                  getNestedValue(row, col.key)
                                )?.toLowerCase() === "active"
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              )}
                            />
                          </Switch>
                        </div>
                      ) : col.key === "img" ? (
                        <div className="flex justify-center items-center w-full h-full min-h-[60px]">
                          {row[col.key]}
                        </div>
                      ) : col.key === "map" ? (
                        (() => {
                          const url = getNestedValue(row, col.key);
                          if (!url) return "N/A";
                          const displayText =
                            url.length > 20
                              ? `${url.substring(0, 10)}...${url.substring(
                                url.length - 10
                              )}`
                              : url;
                          const mapLink = url.startsWith("http") ? url : `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(url)}`;
                          return (
                            <div className="relative w-[120px] truncate group">
                              <a
                                href={mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {displayText}
                              </a>
                              {url.length > 20 && (
                                <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded whitespace-pre-wrap max-w-xs break-words">
                                  {url}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        getNestedValue(row, col.key)
                      )}
                    </TableCell>
                  ))}
                  {(showEditButton || showDeleteButton || showActions) && (
                    <TableCell className="!py-3">
                      <div className="flex justify-center items-center gap-2">
                        {showEditButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onEdit?.(row);
                            }}
                          >
                            <Edit className="w-4 h-4 text-bg-primary" />
                          </Button>
                        )}
                        {showDeleteButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(row)}
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                        {showRowSelection && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowSelect(row);
                            }}
                          >
                            <CheckSquare
                              className={clsx(
                                "w-4 h-4",
                                selectedRows.includes(row.id)
                                  ? "text-bg-primary"
                                  : "text-gray-400"
                              )}
                            />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    1 +
                    (showRowSelection ? 1 : 0) +
                    (showEditButton || showDeleteButton || showActions ? 1 : 0)
                  }
                  className="text-center text-gray-500 py-4"
                >
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="w-full !mb-10 max-w-[1200px] mx-auto">
          <Pagination className="!mb-2 flex justify-center items-center m-auto">
            <PaginationContent className="text-bg-primary font-semibold flex gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(displayCurrentPage - 1)}
                  disabled={displayCurrentPage === 1}
                  className={clsx("cursor-pointer", { "opacity-50": displayCurrentPage === 1 })}
                />
              </PaginationItem>

              {getPaginationItems(displayCurrentPage, displayTotalPages).map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? (
                    <span className="px-3 py-1 text-gray-500">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      aria-current={displayCurrentPage === page ? "page" : undefined}
                      className={clsx(
                        "border border-gray-400 hover:bg-gray-200 transition-all px-3 py-1 rounded-lg cursor-pointer",
                        {
                          "bg-bg-primary text-white hover:bg-bg-primary": displayCurrentPage === page,
                          "text-bg-primary": displayCurrentPage !== page,
                        }
                      )}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(displayCurrentPage + 1)}
                  disabled={displayCurrentPage === displayTotalPages || displayTotalPages === 0}
                  className={clsx("cursor-pointer", { "opacity-50": displayCurrentPage === displayTotalPages || displayTotalPages === 0 })}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}