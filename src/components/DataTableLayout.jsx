// DataTable.jsx
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
import { Edit, Trash, Plus } from "lucide-react";
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
  showAddButton = true, // This prop controls the add button in the header
  showDeleteButtonInHeader = false, // New prop for delete button in the header
  onDeleteInHeader, // New prop for the delete action in the header
  showFilter = true,
  showActions = true,
  showEditButton = true,
  showDeleteButton = true,
  searchKeys = [],
}) {
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const navigate = useNavigate();

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  // Memoized filtered data
  const filteredData = useMemo(() => {
    console.log("Filtered Data:", data);
    return data.filter((row) => {
      const matchesSearch = searchKeys.some((key) => {
        const value = getNestedValue(row, key);
        const searchableValue = value?.toString() || "";
        return searchableValue.toLowerCase().includes(searchValue.toLowerCase());
      });

      const matchesFilter =
        !filterValue || row.status?.toLowerCase() === filterValue.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [data, searchValue, filterValue, searchKeys]);

  console.log("columns", columns);

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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {showAddButton && ( // Controls the Add button
                <Button
                  onClick={() => (onAdd ? onAdd() : navigate(addRoute))}
                  className="bg-bg-primary cursor-pointer text-white hover:bg-teal-700 rounded-[10px] !p-3"
                >
                  <Plus className="w-5 h-5 !mr-2" />
                  Add
                </Button>
              )}
              {showDeleteButtonInHeader && ( // Controls the new Delete button in header
                <Button
                  onClick={onDeleteInHeader} // Use the new onDeleteInHeader prop
                  className="bg-red-600 cursor-pointer text-white hover:bg-red-700 rounded-[10px] !p-3"
                >
                  <Trash className="w-5 h-5 !mr-2" />
                  Delete Selected
                </Button>
              )}
            </div>
          )}
        </>
      </div>

      {/* Table */}
      <div className="max-h-[calc(100vh-300px)]">
        <Table className="!min-w-[600px]">
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead
                  key={index}
                  className="text-bg-primary font-semibold"
                >
                  {col.label}
                </TableHead>
              ))}
              {(showEditButton || showDeleteButton) && (
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
                  {columns.map((col, idx) => (
                    <TableCell
                      key={idx}
                      className={clsx(
                        "!px-2 !py-1 text-sm whitespace-normal break-words",
                        col.key === "image" && "h-full min-h-[60px] flex justify-center items-center"
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
                      ) : col.key === "image" ? (
                        <div className="flex justify-center items-center  w-full h-full min-h-[60px]">
                          <img
                            src={row[col.key]}
                            alt="Image"
                            className="h-10  !m-auto w-auto object-contain"
                          />
                        </div>
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        row[col.key]
                      )}
                    </TableCell>
                  ))}
                  {(showEditButton || showDeleteButton) && (
                    <TableCell className="!py-3">
                      <div className="flex justify-center items-center gap-2">
                        {showEditButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("Edit clicked for row:", row);
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
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (showEditButton || showDeleteButton ? 1 : 0)
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