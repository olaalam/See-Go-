import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable from "@/components/DataTableLayout";
import DeleteDialog from "@/components/DeleteDialog";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from "react-toastify";
import Loading from "@/components/Loading";
import { Label } from "@radix-ui/react-label";
import { Outlet } from "react-router-dom";

export default function VUnit() {
  const [adminData, setAdminData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // villagePositions is fetched but not used here, consider if it's needed
  const [villagePositions, setVillagePositions] = useState([]);
  const [selectedRowsForDeletion, setSelectedRowsForDeletion] = useState([]);
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const columns = [
    { label: "Owner Name", key: "name" },
    { label: "Phone Number", key: "phone" },
    { label: "Type Of Units", key: "type_unit" },
    { label: "Unit Name", key: "unit_name" },
  ];

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!token) throw new Error("Missing auth token");

        const adminRes = await fetch(
          `https://bcknd.sea-go.org/admin/village/village_units?village_id=${id}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );

        const adminJson = await adminRes.json();
        console.log("VAdmin Raw Response:", adminJson);

        const units = Array.isArray(adminJson.units) ? adminJson.units : [];

        setVillagePositions(units); // Still setting it, but it's not directly used for display in this component

        const formattedAdmins = units.map((unit) => ({
          ...unit,
          id: unit.id, // Make sure 'id' is present
          admin_position_name: unit.unit_name || "Unknown", // Display enhancement
        }));

        console.log("Formatted units:", formattedAdmins);
        setAdminData(formattedAdmins);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load units data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  const handleDelete = (admin) => {
    if (!admin?.id) {
      toast.error("Selected unit has no ID.");
      return;
    }
    setSelectedRow(admin);
    setSelectedRowsForDeletion([admin.id]);
    setIsDeleteOpen(true);
  };

  const handleDeleteSelectedInHeader = (ids) => {
    const validIds = ids.filter((id) => id !== undefined && id !== null);
    if (validIds.length === 0) {
      toast.warn("No valid units selected.");
      return;
    }
    setSelectedRow(null);
    setSelectedRowsForDeletion(validIds);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedRowsForDeletion.length === 0) {
        toast.warn("No units selected for deletion.");
        setIsDeleteOpen(false);
        return;
      }

      const queryParams = selectedRowsForDeletion
        .map((id) => `appartment_ids[]=${encodeURIComponent(id)}`)
        .join("&");

      const url = `https://bcknd.sea-go.org/admin/village/village_units_delete?${queryParams}`;

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("Units deleted successfully!");
        setAdminData((prev) =>
          prev.filter((unit) => !selectedRowsForDeletion.includes(unit.id))
        );
        setIsDeleteOpen(false);
        setSelectedRowsForDeletion([]);
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to delete units: ${errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error deleting units:", error);
      toast.error("Error deleting units.");
    }
  };

  // --- Filtering Logic Refinement ---
  // Generate unique 'type_unit' filter options from adminData
const uniqueUnitTypes = Array.from(new Set(adminData.map(unit => unit.type_unit)))
  .filter(type => type && type !== "—") // Filter out empty or placeholder names
  .map(type => ({ value: type, label: type }));

const filterOptionsForUnits = [
  {
    key: "unitType", // هذا هو المفتاح الذي سيمثل فئة الفلترة (نوع الوحدة)
    label: "Unit Type", // هذا هو النص الذي سيظهر كعنوان للفلتر
    options: [
      { value: "all", label: "All Unit Types" }, // خيار "الكل" لهذه الفئة
      ...uniqueUnitTypes, 
    ],
  },
];
  return (
    <div>
      <ToastContainer />
      {isLoading ? (
        <Loading />
      ) : adminData.length > 0 ? (
        <>
          <DataTable
            data={adminData}
            columns={columns}
            className="table-compact"
            onDelete={handleDelete}
            onDeleteInHeader={handleDeleteSelectedInHeader}
            searchKeys={["name", "phone", "type_unit", "unit_name"]}
            showDeleteButtonInHeader={true}
            showAddButton={false}
            showEditButton={false}
            showRowSelection={true}
            showDeleteButton={true}
            filterKey={["type_unit"]} // Specify that we want to filter by the 'type_unit' key
            filterOptions={filterOptionsForUnits} // Use the new options for units
          />

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={
              selectedRowsForDeletion.length > 1
                ? `${selectedRowsForDeletion.length} selected units`
                : selectedRow?.unit_name || "this unit" // Use unit_name for better context
            }
          />

          <Outlet />
        </>
      ) : (
        <div className="text-center text-gray-500 p-4">
          No unit users found for this village.
        </div>
      )}
    </div>
  );
}

const InputField = ({ label, id, value, onChange, type = "text" }) => (
  <div>
    <Label htmlFor={id} className="text-gray-400 !pb-1">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
    />
  </div>
);