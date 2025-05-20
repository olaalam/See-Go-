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

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fetchmaintenance_types = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/maintenance_type", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = result.maintenance_types.map((maintenance_type) => {
        const translations = maintenance_type.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || maintenance_type.name || "—";

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
    setSelectedRow(maintenance_type);
    setIsEditOpen(true);
  };

  const handleDelete = (maintenance_type) => {
    setSelectedRow(maintenance_type);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    const { id, name, status, imageFile } =
      selectedRow;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("status", status === "Active" ? 1 : 0);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/maintenance_type/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("maintenance_type updated successfully!");
        const responseData = await response.json();

        setmaintenance_types((prev) =>
          prev.map((maintenance_type) =>
            maintenance_type.id === id
              ? {
                  ...maintenance_type,
                  name: responseData?.maintenance_type?.name || name,
                  status:
                    responseData?.maintenance_type?.status === 1 ? "Active" : "Inactive",
                  image_link: responseData?.maintenance_type?.image_link || maintenance_type.image_link,
                  img: responseData?.maintenance_type?.image_link ? (
                    <img
                      src={responseData.maintenance_type.image_link}
                      alt={responseData?.maintenance_type?.name || name}
                      className="w-12 h-12 rounded-md object-cover aspect-square"
                      onError={() => {}}
                    />
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {responseData?.maintenance_type?.name?.charAt(0) || name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ),
                }
              : maintenance_type
          )
        );
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update maintenance_type!");
      }
    } catch (error) {
      console.error("Error updating maintenance_type:", error);
      toast.error("Error occurred while updating maintenance_type!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/maintenance_type/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("maintenance_type deleted successfully!");
        setmaintenance_types(maintenance_types.filter((maintenance_type) => maintenance_type.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete maintenance_type!");
      }
    } catch (error) {
      console.error("Error deleting maintenance_type:", error);
      toast.error("Error occurred while deleting maintenance_type!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/maintenance_type/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("maintenance_type status updated successfully!");
        setmaintenance_types((prevmaintenance_types) =>
          prevmaintenance_types.map((maintenance_type) =>
            maintenance_type.id === id
              ? { ...maintenance_type, status: newStatus === 1 ? "Active" : "Inactive" }
              : maintenance_type
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update maintenance_type status:", errorData);
        toast.error("Failed to update maintenance_type status!");
      }
    } catch (error) {
      console.error("Error updating maintenance_type status:", error);
      toast.error("Error occurred while updating maintenance_type status!");
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
        imageFile: file,
      }));
    }
  };

  const columns = [
    { key: "name", label: "maintenance_type Name" },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={maintenance_types}
        columns={columns}
        addRoute="/maintenance/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "description"]}
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
              maintenance_type Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
            />

            <label htmlFor="image" className="text-gray-400 !pb-3">
              Image
            </label>
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
            selectedRow={selectedRow}
          />
        </>
      )}
    </div>
  );
};

export default Maintenance_types;
