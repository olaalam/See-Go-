import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable from "@/components/DataTableLayout";
import DeleteDialog from "@/components/DeleteDialog";
// import EditDialog from "@/components/EditDialog"; // No longer directly used here for rendering the edit dialog
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
  const [villageOptions, setVillageOptions] = useState([]);
  const [villagePositions, setVillagePositions] = useState([]);
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const columns = [
    { label: "Owner Name", key: "name" },
    { label: "Phone Number", key: "phone" },
    { label: "Type Of Units", key: "email" },
    { label: "Number Units", key: "role" },
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
          `https://bcknd.sea-go.org/admin/village_admin/${id}`,
          {
            headers: getAuthHeaders(),
          }
        );
        const adminJson = await adminRes.json();
        console.log("VAdmin", adminJson);
        const villagePositions = adminJson.village_positions;
        setVillagePositions(villagePositions);

        const formattedAdmins = (
          Array.isArray(adminJson.admins)
            ? adminJson.admins
            : [adminJson.admins]
        ).map((admin) => {
          const position = villagePositions.find(
            (pos) => pos.id === admin.admin_position_id
          );
          return {
            ...admin,
            status:
              typeof admin.status === "string"
                ? admin.status
                : admin.status === 1
                ? "Active"
                : "Inactive",
            admin_position_name: position ? position.name : "Unknown",
          };
        });
        setAdminData(formattedAdmins);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchVillageOptions = async () => {
      try {
        const villagesRes = await fetch(
          "https://bcknd.sea-go.org/admin/village",
          {
            headers: getAuthHeaders(),
          }
        );

        if (villagesRes.ok) {
          const villagesData = await villagesRes.json();
          const currentLang = localStorage.getItem("lang") || "en";
          setVillageOptions(
            villagesData.villages.map((v) => ({
              value: v.id.toString(),
              label:
                v.translations.find((t) => t.locale === currentLang)?.name ||
                v.name,
            }))
          );
        } else {
          toast.error("Failed to load villages.");
        }
      } catch (error) {
        console.error("Error fetching villages:", error);
        toast.error("Error loading villages.");
      }
    };

    fetchVillageOptions();
  }, [token]);

  const handleDelete = (admin) => {
    setSelectedRow(admin);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_admin/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Admin deleted!");
        setAdminData((prev) =>
          prev.filter((admin) => admin.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete admin.");
      }
    } catch (error) {
      toast.error("Error deleting admin.", error);
    }
  };

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
            searchKeys={["name", "email"]}
            showDeleteButtonInHeader = {true}
             showAddButton = {false}
            showEditButton={false}
            showDeleteButton={true}
          />

          {selectedRow && (
            <>
              <DeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onDelete={handleDeleteConfirm}
                name={selectedRow?.name}
              />
            </>
          )}
          <Outlet />
        </>
      ) : (
        <div className="text-center text-gray-500 p-4">
          No admin users found for this village.
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