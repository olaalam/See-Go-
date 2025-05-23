import { useState, useMemo } from "react";
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
  PaginationEllipsis,
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
  filterKey = [], // Changed to an array to handle multiple filter keys
  filterOptions = [],
}) {
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all"); // Default to 'all' to show all data
  const [selectedRows, setSelectedRows] = useState([]);
  const navigate = useNavigate();

  const getNestedValue = (obj, path) => {
    // Safely get nested value, returning undefined if any part of the path is null/undefined
    // This helper itself does not convert to lowercase or handle null/undefined for string methods
    return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = searchKeys.some((key) => {
        const value = getNestedValue(row, key);
        // Ensure value is treated as a string for searching
        const searchableValue = value?.toString() || ""; // Convert to string before toLowerCase
        return searchableValue.toLowerCase().includes(searchValue.toLowerCase());
      });

      const matchesFilter =
        filterValue === "all" ||
        filterKey.some((key) => {
          const rowValue = getNestedValue(row, key);

          // FIX IS HERE: Ensure rowValue is a string before calling toLowerCase()
          const comparableRowValue =
            rowValue !== null && rowValue !== undefined
              ? String(rowValue).toLowerCase() // Convert to string and then to lowercase
              : ""; // Treat null/undefined as empty string for comparison

          // Ensure filterValue is also treated as a string for comparison
          const comparableFilterValue = String(filterValue).toLowerCase();

          return comparableRowValue === comparableFilterValue;
        });

      return matchesSearch && matchesFilter;
    });
  }, [data, searchValue, filterValue, searchKeys, filterKey]);

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
      setSelectedRows(filteredData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  return (
    <div className="w-full !p-3 space-y-6">
      <div className="flex justify-between !mb-6 items-center flex-wrap gap-4">
        <>
          <Input
            placeholder="Search..."
            className="w-full md:!ms-3 sm:!ms-0 !ps-3 sm:w-1/3 max-w-sm border-bg-primary focus:border-bg-primary focus:ring-bg-primary rounded-[10px]"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {showFilter && (
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-[120px] border-bg-primary focus:ring-bg-primary rounded-[10px] !px-2">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent className="bg-white border-bg-primary rounded-md shadow-lg !p-3">
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showAddButton && (
                <Button
                  onClick={() => (onAdd ? onAdd() : navigate(addRoute))}
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
          )}
        </>
      </div>

      <div className="max-h-[calc(100vh-300px)]">
        <Table className="!min-w-[600px]">
          <TableHeader>
            <TableRow>
              {showRowSelection && (
                <TableHead className="text-bg-primary font-semibold w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length === filteredData.length &&
                      filteredData.length > 0
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
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={index}>
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
                        col.key === "img" && // Corrected from "image" to "img"
                          "h-full min-h-[60px] flex justify-center items-center"
                      )}
                    >
                      {col.key === "status" ? (
                        <div className="flex justify-center items-center gap-2">
                          <Switch
                            checked={row.status?.toLowerCase() === "active"}
                            onCheckedChange={(checked) =>
                              onToggleStatus?.(row, checked ? 1 : 0)
                            }
                            className={clsx(
                              "relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none",
                              row.status?.toLowerCase() === "active"
                                ? "bg-bg-primary"
                                : "bg-gray-300"
                            )}
                          >
                            <span
                              className={clsx(
                                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                                row.status?.toLowerCase() === "active"
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              )}
                            />
                          </Switch>
                        </div>
                      ) : col.key === "img" ? ( // Corrected from "image" to "img"
                        <div className="flex justify-center items-center w-full h-full min-h-[60px]">
                          {row[col.key]} {/* Render the JSX directly */}
                        </div>
                      ) :col.key === "map" ? (
  (() => {
    const url = row[col.key];
    if (!url) return "N/A"; // Handle missing URL

    const displayText =
      url.length > 20
        ? `${url.substring(0, 10)}...${url.substring(url.length - 10)}`
        : url;

    return (
      <div className="relative w-[120px] truncate group">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(url)}`}
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
) : 
col.render ? (
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
          {/* Pagination is likely controlled by a separate state,
              not directly by filteredData, so keep this as is or implement full pagination logic. */}
          <Pagination className="!mb-2 flex justify-center items-center m-auto">
            <PaginationContent className="text-bg-primary font-semibold flex gap-2">
              <PaginationItem>
                <PaginationPrevious href="#" className="text-bg-primary" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  className="border border-gray-400 hover:bg-gray-200 transition-all px-3 py-1 rounded-lg text-bg-primary"
                  href="#"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis className="text-bg-primary" />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" className="text-bg-primary" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}