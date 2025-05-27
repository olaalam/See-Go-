import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function PAdmin() {
  const [adminData, setAdminData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [providerOptions, setproviderOptions] = useState([]);

  const [providerPositions, setproviderPositions] = useState([]);
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const columns = [
    { label: "Username", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Role", key: "admin_position_name" }, // Changed key to match formatted data
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
          `https://bcknd.sea-go.org/admin/provider_admin/${id}`,
          {
            headers: getAuthHeaders(),
          }
        );
        const adminJson = await adminRes.json();
        console.log("PAdmin", adminJson);
        const providerPositionsData = adminJson.provider_positions;
        setproviderPositions(providerPositionsData); // Store the raw positions

        const formattedAdmins = (
          Array.isArray(adminJson.admins)
            ? adminJson.admins
            : [adminJson.admins]
        ).map((admin) => {
          const position = providerPositionsData.find(
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
            admin_position_name: position ? position.name : "Unknown", // Add formatted role name
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
    const fetchproviderOptions = async () => {
      try {
        const providersRes = await fetch(
          "https://bcknd.sea-go.org/admin/provider",
          {
            headers: getAuthHeaders(),
          }
        );

        if (providersRes.ok) {
          const providersData = await providersRes.json();
          const currentLang = localStorage.getItem("lang") || "en";
          setproviderOptions(
            providersData.providers.map((v) => ({
              value: v.id.toString(),
              label:
                v.translations.find((t) => t.locale === currentLang)?.name ||
                v.name,
            }))
          );
        } else {
          toast.error("Failed to load providers.");
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast.error("Error loading providers.");
      }
    };

    fetchproviderOptions();
  }, [token]);

  const handleToggleStatus = async (row, newStatus) => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_admin/status/${row.id}?status=${newStatus}`,

        { method: "PUT", headers: getAuthHeaders() }
      );

      if (response.ok) {
        toast.success("Provider status updated!");

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
        `https://bcknd.sea-go.org/admin/provider_admin/delete/${selectedRow.id}`,
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
      provider_id,
    } = selectedRow;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider_admin/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
            admin_position_id,
            status: selectedRow?.status === "Active" ? 1 : 0,
            provider_id,
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
                  provider_id,
                  admin_position_name: providerPositions.find(
                    (pos) => pos.id === admin_position_id
                  )?.name || "Unknown",
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
      [key]: key === "provider_id" ? parseInt(value, 10) : value,
    }));
  };

  // Prepare filter options for role and status, combined
  const filterOptionsForAdmins = [
    { value: "all", label: "All" }, // Option to clear filters
    ...providerPositions.map((position) => ({
      value: position.name, // Filter by role name
      label: position.name,
    })),
    { value: "active", label: "Active" }, // Filter by status
    { value: "inactive", label: "Inactive" }, // Filter by status
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
            addRoute={`/providers/single-page-p/${id}/add`}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            searchKeys={["name", "email"]}
            showFilter={true}
            filterKey={["status", "admin_position_name"]} // Now filtering by both status AND role
            filterOptions={filterOptionsForAdmins}
            // Removed showAdditionalFilter, additionalFilterKey, additionalFilterOptions
            // as we are combining them into one filter
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
                  <label htmlFor="position" className="text-gray-400">
                    Admin Position
                  </label>
                  {providerPositions.length > 0 && (
                    <Select
                      id="position"
                      value={selectedRow?.admin_position_id?.toString()}
                      onValueChange={(value) =>
                        onChange("admin_position_id", value)
                      }
                    >
                      <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary rounded-[10px]">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {providerPositions.map((position) => (
                          <SelectItem
                            key={position.id}
                            value={position.id.toString()}
                          >
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div>
                    <label htmlFor="provider" className="text-gray-400">
                      Provider
                    </label>
                    <Select
                      value={selectedRow?.provider_id?.toString()}
                      onValueChange={(value) => onChange("provider_id", value)}
                    >
                      <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary rounded-[10px]">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {providerOptions.map((v) => (
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
      ) : (
        <div className="text-center text-gray-500 p-4">
          No admin users found for this provider.
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