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

const Apartment = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [apartment, setApartment] = useState([]);
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

  const fetchApartment = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/appartment_type",
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

      const formatted = result.appartment_types.map((appartment_types) => {
        const translations = appartment_types.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name =
          translations[currentLang]?.name || appartment_types.name || "—";
        const description =
          translations[currentLang]?.description ||
          appartment_types.description ||
          "—";

        const image =
          appartment_types?.image_link && !imageErrors[appartment_types.id] ? (
            <img
              src={appartment_types.image_link}
              alt={name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(appartment_types.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        return {
          id: appartment_types.id,
          name,
          description,
          img: image,
          numberOfVillages: appartment_types.villages_count ?? "0",
          status: appartment_types.status === 1 ? "Active" : "Inactive",
          image_link: appartment_types.image_link,
        };
      });

      setApartment(formatted);
    } catch (error) {
      console.error("Error fetching apartment:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchApartment();
  }, []);

  const handleEdit = (appartment_types) => {
    setSelectedRow(appartment_types);
    setIsEditOpen(true);
  };

  const handleDelete = (appartment_types) => {
    setSelectedRow(appartment_types);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    const { id, name, status } = selectedRow;

    const formData = new FormData();
    formData.append("name", name);

    formData.append("status", status === "Active" ? 1 : 0);

    if (selectedRow.imageFile) {
      formData.append("image", selectedRow.imageFile);
    } else if (selectedRow.image_link) {
      // Send the existing image as a fallback
      formData.append("image", selectedRow.image_link);
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/appartment_type/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Apartment updated successfully!");
        await fetchApartment();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update Apartment!");
      }
    } catch (error) {
      console.error("Error updating apartment:", error);
      toast.error("Error occurred while updating apartment!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/appartment_type/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Apartment deleted successfully!");
        setApartment(
          apartment.filter((apartment) => apartment.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete apartment!");
      }
    } catch (error) {
      console.error("Error deleting apartment:", error);
      toast.error("Error occurred while deleting apartment!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/appartment_type/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Apartment status updated successfully!");
        setApartment((prevApartment) =>
          prevApartment.map((apartment) =>
            apartment.id === id
              ? {
                  ...apartment,
                  status: newStatus === 1 ? "Active" : "Inactive",
                }
              : apartment
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update apartment status:", errorData);
        toast.error("Failed to update apartment status!");
      }
    } catch (error) {
      console.error("Error updating apartment status:", error);
      toast.error("Error occurred while updating apartment status!");
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

  // Define filter options for status, now correctly grouped
  const filterOptionsForApartment = [
    {
      key: "status", // This matches the filterKey
      label: "Filter by Status", // Label for the filter group in the UI
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Active", label: "Active" }, // Make sure these values match your data's status values
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  const columns = [
    { key: "name", label: "Unit Name" },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={apartment}
        columns={columns}
        addRoute="/units/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name"]}
        showFilter={true} // Ensure the filter dropdown is shown
        // filterKey is still needed to tell DataTableLayout which property on the data to filter by
        filterKey={["status"]}
        filterOptions={filterOptionsForApartment} // Pass the correctly structured options
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
              Apartment Name
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

export default Apartment;