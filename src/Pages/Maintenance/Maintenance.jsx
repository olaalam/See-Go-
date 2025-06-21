import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";

const Maintenance_types = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [maintenance_types, setmaintenance_types] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [permissions, setPermissions] = useState([]); // State for permissions

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

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
    const match = permission.match(/^Maintenance Type(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Maintenance Type:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);
  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };


  const fetchmaintenance_types = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/maintenance_type",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = result.maintenance_types.map((maintenance_type) => {
        const translations = maintenance_type.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name =
          translations[currentLang]?.name || maintenance_type.name || "—";

        const image =
          maintenance_type?.image_link && !imageErrors[maintenance_type.id] ? (
            <img
              src={maintenance_type.image_link}
              alt={name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(maintenance_type.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        return {
          id: maintenance_type.id,
          name,
          img: image,
          status: maintenance_type.status === 1 ? "Active" : "Inactive",
          image_link: maintenance_type.image_link, // Keep the raw link for updating
        };
      });

      setmaintenance_types(formatted);
    } catch (error) {
      console.error("Error fetching maintenance_types:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchmaintenance_types();
  }, []);

  const handleEdit = (maintenance_type) => {
    // When opening for edit, store the original image_link if it exists
    setSelectedRow({ ...maintenance_type, original_image_link: maintenance_type.image_link });
    setIsEditOpen(true);
  };

  const handleDelete = (maintenance_type) => {
    setSelectedRow(maintenance_type);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    const { id, name, status } = selectedRow;
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("Maintenance TypeEdit")) {
      toast.error("You don't have permission to edit zones");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("status", status === "Active" ? 1 : 0);

    // **MODIFIED LOGIC HERE:**
    if (selectedRow.imageFile) {
      // If a new file is selected (via input type="file"), append the new file
      formData.append("image", selectedRow.imageFile);
    } else if (selectedRow.original_image_link) {
      // If no new file is selected, but an original image link exists, append the old link as a string
      formData.append("image", selectedRow.original_image_link);
    }
    // If neither exists, don't append an image (or handle as a case where image is removed if that's a feature)

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/maintenance_type/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(), // Keep these headers if they are for auth only, otherwise they might conflict with FormData's Content-Type
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Maintenance type updated successfully!");
        // Re-fetch all data to ensure consistency with backend
        await fetchmaintenance_types();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update maintenance type!");
      }
    } catch (error) {
      console.error("Error updating maintenance type:", error);
      toast.error("Error occurred while updating maintenance type!");
    }
  };

  const handleDeleteConfirm = async () => {
        // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("Maintenance TypeDelete")) {
      toast.error("You don't have permission to delete zones");
      return;
    }
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/maintenance_type/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Maintenance type deleted successfully!");
        setmaintenance_types(
          maintenance_types.filter(
            (maintenance_type) => maintenance_type.id !== selectedRow.id
          )
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete maintenance type!");
      }
    } catch (error) {
      console.error("Error deleting maintenance type:", error);
      toast.error("Error occurred while deleting maintenance type!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("Maintenance TypeStatus")) {
      toast.error("You don't have permission to change zone status");
      return;
    }
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/maintenance_type/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Maintenance type status updated successfully!");
        setmaintenance_types((prevmaintenance_types) =>
          prevmaintenance_types.map((maintenance_type) =>
            maintenance_type.id === id
              ? {
                  ...maintenance_type,
                  status: newStatus === 1 ? "Active" : "Inactive",
                }
              : maintenance_type
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update maintenance type status:", errorData);
        toast.error("Failed to update maintenance type status!");
      }
    } catch (error) {
      console.error("Error updating maintenance type status:", error);
      toast.error("Error occurred while updating maintenance type status!");
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedRow((prev) => ({
        ...prev,
        imageFile: file, // Store the new file object
        image_link: URL.createObjectURL(file), // Update image_link for preview
      }));
    } else {
      // If user clears the selected file, remove imageFile and revert image_link to original or null
      setSelectedRow((prev) => ({
        ...prev,
        imageFile: null,
        image_link: prev.original_image_link || null,
      }));
    }
  };

  const columns = [
    { key: "name", label: "Maintenance Type Name" },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForZones = [
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
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={maintenance_types}
        columns={columns}
                showAddButton={hasPermission("Maintenance TypeAdd")} // هذا يتحكم في إرسال الـ prop من الأساس

        addRoute="/maintenance/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
                showEditButton={hasPermission("Maintenance TypeEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
        showDeleteButton={hasPermission("Maintenance TypeDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
        showActions={hasPermission("Maintenance TypeEdit") || hasPermission("Maintenance TypeDelete")}
        searchKeys={["name"]}
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
            columns={columns}
            onChange={onChange}
          >
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Maintenance Type Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
            />

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
          </EditDialog>
          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
          />
        </>
      )}
    </div>
  );
};

export default Maintenance_types;