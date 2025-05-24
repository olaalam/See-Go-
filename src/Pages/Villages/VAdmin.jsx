import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import DataTable from "@/components/DataTableLayout";
import DeleteDialog from "@/components/DeleteDialog";
import EditDialog from "@/components/EditDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast, ToastContainer } from "react-toastify";
import Loading from "@/components/Loading";
import { Label } from "@radix-ui/react-label";
import { Outlet } from "react-router-dom";

export default function VAdmin() {
  const [adminData, setAdminData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [villageOptions, setVillageOptions] = useState([]);
  const [villagePositions, setVillagePositions] = useState([]);
  const { id } = useParams(); 
  const navigate = useNavigate(); 
  const token = localStorage.getItem("token");

  // Corrected columns array
  const columns = [
    {
      label: "Username",
      key: "name",
      render: (row) => (
        <span
          onClick={() => navigate(`/villages/single-page-v/${id}/admin/${row.id}`)} 
          className="text-bg-primary hover:text-teal-800 cursor-pointer"
        >
          {row.name}
        </span>
      ),
    },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Role", key: "role" },
    { key: "status", label: "Status" },
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
            : [] // If adminJson.admins is not an array, default to an empty array
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
            role: position ? position.name : "Unknown", 
          };
        });
        setAdminData(formattedAdmins);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load admin data.");
        setAdminData([]); // Ensure adminData is an empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, token, navigate]);

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

  const handleToggleStatus = async (row, newStatus) => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_admin/status/${row.id}?status=${newStatus}`,
        { method: "PUT", headers: getAuthHeaders() }
      );

      if (response.ok) {
        toast.success("Village status updated!");

        setAdminData((prev) =>
          prev.map((admin) =>
            admin.id === row.id
              ? {
                  ...admin,
                  status: newStatus === 1 ? "Active" : "Inactive",
                }
              : admin
          )
        );
      } else {
        toast.error("Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Error updating status.");
    }
  };

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

  const handleEdit = (admin) => {
    setSelectedRow({ ...admin });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    const {
      id,
      name,
      email,
      phone,
      password,
      admin_position_id,
      status, 
      village_id,
    } = selectedRow;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_admin/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
            admin_position_id,
            status: status === "Active" ? 1 : 0, 
            village_id,
          }),
        }
      );

      if (response.ok) {
        toast.success("Admin updated successfully!");
        setAdminData((prev) =>
          prev.map((admin) =>
            admin.id === id
              ? {
                  ...admin,
                  name,
                  email,
                  phone,
                  admin_position_id,
                  status: status === "Active" ? "Active" : "Inactive", 
                  village_id,
                }
              : admin
          )
        );
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to update admin.");
      }
    } catch (err) {
      toast.error("Error updating admin.", err);
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: key === "village_id" || key === "admin_position_id" ? parseInt(value, 10) : value, 
    }));
  };
  // Define filter options for status, including an "All" option
  const filterOptionsForZones = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div>
      <ToastContainer />
      {isLoading ? (
        <Loading />
      ) : ( // Corrected: This `else` block now correctly wraps the DataTable and dialogs
        <>
          <DataTable
            data={adminData}
            columns={columns}
            className="table-compact"
            addRoute={`/villages/single-page-v/${id}/add`}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            searchKeys={["name", "email", "phone", "role"]} 
            showFilter={true} 
            filterKey={["status"]} 
            filterOptions={filterOptionsForZones}
          />

          {selectedRow && (
            <>
              <EditDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSave={handleSave}
                selectedRow={selectedRow}
                onChange={onChange}
              >
                <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <InputField
                    label="Name"
                    id="name"
                    value={selectedRow?.name}
                    onChange={(val) => onChange("name", val)}
                  />
                  <InputField
                    label="Email"
                    id="email"
                    value={selectedRow?.email}
                    onChange={(val) => onChange("email", val)}
                  />
                  <InputField
                    label="Phone Number"
                    id="phone"
                    value={selectedRow?.phone}
                    onChange={(val) => onChange("phone", val)}
                  />
                  <InputField
                    label="Password"
                    id="password"
                    type="password"
                    value={selectedRow?.password}
                    onChange={(val) => onChange("password", val)}
                  />
                  {villagePositions.length > 0 && (
                    <div className="w-full">
                      <Label htmlFor="adminPosition" className="text-gray-400">
                        Position
                      </Label>
                      <Select
                        value={selectedRow?.admin_position_id?.toString()}
                        onValueChange={(value) =>
                          onChange("admin_position_id", value)
                        }
                      >
                        <SelectTrigger
                          id="adminPosition"
                          className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary rounded-[10px]"
                        >
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                          {villagePositions.map((position) => (
                            <SelectItem
                              key={position.id}
                              value={position.id.toString()}
                            >
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="village" className="text-gray-400">
                      Village
                    </label>
                    <Select
                      value={selectedRow?.village_id?.toString()}
                      onValueChange={(value) => onChange("village_id", value)}
                    >
                      <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary rounded-[10px]">
                        <SelectValue placeholder="Select village" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {villageOptions.map((v) => (
                          <SelectItem key={v.value} value={v.value}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </EditDialog>

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