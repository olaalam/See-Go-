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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function VAdmin() {
  const [adminData, setAdminData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // New state for save loading
  const [villageOptions, setVillageOptions] = useState([]);
  const [villagePositions, setVillagePositions] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [permissions, setPermissions] = useState([]); // State for permissions

  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };
  // الحصول على الصلاحيات من localStorage
  const getUserPermissions = () => {
    try {
      const permissions = localStorage.getItem("userPermission");
      const parsed = permissions ? JSON.parse(permissions) : [];

      const flatPermissions = parsed.map(
        (perm) => `${perm.module}:${perm.action}`
      );
      console.log("Flattened permissions:", flatPermissions);
      return flatPermissions;
    } catch (error) {
      console.error("Error parsing user permissions:", error);
      return [];
    }
  };

  // التحقق من وجود صلاحية معينة
  const hasPermission = (permission) => {
    const match = permission.match(/^Village Admin(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Village Admin:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);
  // Corrected columns array
  const columns = [
    { label: "Image", key: "image" },
    {
      label: "Username",
      key: "name",
    },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Role", key: "role" },
    { key: "status", label: "Status" },
  ];

  // Modified getAuthHeaders to return an object suitable for both JSON and FormData
  const getAuthHeaders = (isFormData = false) => {
    const headers = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedRow((prev) => ({
        ...prev,
        imageFile: file, // Store the actual File object
        image_link: URL.createObjectURL(file), // Create a temporary URL for preview
      }));
    } else {
      setSelectedRow((prev) => ({
        ...prev,
        imageFile: null,
        image_link: prev?.original_image_link, // Revert to original if file cleared
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!token) {
          toast.error("Authentication token is missing. Please log in.");
          navigate("/login"); // Redirect to login if no token
          return;
        }

        const adminRes = await fetch(
          `https://bcknd.sea-go.org/admin/village_admin/${id}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!adminRes.ok) {
          throw new Error(`HTTP error! status: ${adminRes.status}`);
        }
        const adminJson = await adminRes.json();
        console.log("VAdmin", adminJson);
        const villagePositions = Array.isArray(adminJson.village_positions)
          ? adminJson.village_positions
          : [];
        setVillagePositions(villagePositions);

        const formattedAdmins = (
          Array.isArray(adminJson.admins) ? adminJson.admins : []
        ).map((admin) => {
          const position = villagePositions.find(
            (pos) => pos.id === admin.admin_position_id
          );
          const name = admin?.name || "N/A"; // Fallback for name
          const image =
            admin?.image_link && !imageErrors[admin.id] ? (
              <img
                src={admin.image_link}
                alt={name}
                className="w-12 h-12 rounded-md object-cover aspect-square"
                onError={() => handleImageError(admin.id)}
              />
            ) : (
              <Avatar className="w-12 h-12">
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
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
            image,
            original_image_link: admin.image_link, // Store original for reversion
          };
        });
        setAdminData(formattedAdmins);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(`Failed to load admin data: ${error.message}`);
        setAdminData([]); // Ensure adminData is an empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, token, navigate, imageErrors]); // Added imageErrors to dependency array

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
        const errorData = await response.json();
        toast.error(
          `Failed to update status: ${errorData.message || response.statusText}`
        );
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
    if (!selectedRow?.id) {
      toast.error("No admin selected for deletion.");
      setIsDeleteOpen(false);
      return;
    }
    if (!hasPermission("Village AdminDelete")) {
      toast.error("You don't have permission to delete zones");
      return;
    }
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
        setSelectedRow(null); // Clear selected row after deletion
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to delete admin: ${errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Error deleting admin.");
    }
  };

  const handleEdit = (admin) => {
    // Store original image link for reverting if image selection is cancelled
    setSelectedRow({ ...admin, original_image_link: admin.image_link });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    if (!hasPermission("Village AdminEdit")) {
      toast.error("You don't have permission to edit zones");
      return;
    }
    setIsSaving(true); // Start loading for save
    const {
      id,
      name,
      email,
      phone,
      password, // Password field - be cautious about sending it if not meant for update
      admin_position_id,
      status,
      village_id,
      imageFile, // The actual file object
    } = selectedRow;

    // Create FormData for file upload if an image file is selected
    const formData = new FormData();
    formData.append("name", name || "");
    formData.append("email", email || "");
    formData.append("phone", phone || "");
    // Only append password if it's not empty, assuming it's optional for update
    if (password) {
      formData.append("password", password);
    }
    formData.append("admin_position_id", admin_position_id);
    formData.append("status", status === "Active" ? 1 : 0);
    formData.append("village_id", village_id);

    // If a new image file is selected, append it to FormData
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      // Use getAuthHeaders(true) to indicate FormData, which means no Content-Type header
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_admin/update/${id}`,
        {
          method: "POST", // Postman image indicates POST for update
          headers: getAuthHeaders(true), // This will only include Authorization
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Admin updated successfully!");
        // Re-fetch data after successful update to get the latest image link and other data
        // This is safer than manually updating state for complex scenarios like image uploads
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to update admin: ${errorData.message || response.statusText}`
        );
      }
    } catch (err) {
      console.error("Error updating admin:", err);
      toast.error("Error updating admin.");
    } finally {
      setIsSaving(false); // End loading for save
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]:
        key === "village_id" || key === "admin_position_id"
          ? parseInt(value, 10)
          : value,
    }));
  };

  // Define filter options for status, including an "All" option
  const filterOptionsForVillageAdmin = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div>
      <ToastContainer />
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <DataTable
            data={adminData}
            columns={columns}
            showAddButton={hasPermission("Village AdminAdd")}
            className="table-compact"
            addRoute={`/villages/single-page-v/${id}/add`}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            searchKeys={["name", "email", "phone", "role"]}
            showFilter={true}
            filterKey={["status"]}
            showEditButton={hasPermission("Village AdminEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
            showDeleteButton={hasPermission("Village AdminDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
            showActions={
              hasPermission("Village AdminEdit") || hasPermission("Village AdminDelete")
            }
            filterOptions={filterOptionsForVillageAdmin}
          />

          {selectedRow && (
            <>
              <EditDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSave={handleSave}
                selectedRow={selectedRow}
                onChange={onChange}
                isSaving={isSaving} // Pass isSaving state to EditDialog
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
                  {/* Password field - use type="password" if you allow editing 
                  <InputField
                    label="Password (leave blank to keep current)"
                    id="password"
                    type="password" // Important for password input
                    value={selectedRow?.password || ""} // Value should be empty for security if not meant to display current
                    onChange={(val) => onChange("password", val)}
                  />*/}
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

                    <label htmlFor="image" className="text-gray-400">
                      Image
                    </label>
                    {selectedRow?.image_link && (
                      <div className="flex items-center gap-4 mb-2">
                        <img
                          src={selectedRow.image_link}
                          alt="Current"
                          className="w-12 h-12 rounded-md object-cover border"
                        />
                      </div>
                    )}
                    <Input
                      type="file"
                      id="image"
                      accept="image/*"
                      className="!my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[5px]"
                      onChange={handleImageChange}
                    />
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
