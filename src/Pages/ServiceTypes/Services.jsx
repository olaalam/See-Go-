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

const Services = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [services, setServices] = useState([]);
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

  const fetchservices = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/service_type",
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

      const formatted = result.service_types.map((service) => {
        const translations = service.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || service.name || "—";
        const description =
          translations[currentLang]?.description || service.description || "—";

        const image =
          service?.image_link && !imageErrors[service.id] ? (
            <img
              src={service.image_link}
              alt={name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(service.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        return {
          id: service.id,
          name,
          description,
          img: image,
          numberOfVillages: service.villages_count ?? "0",
          status: service.status === 1 ? "Active" : "Inactive",
          image_link: service.image_link, // Keep the raw link for updating
        };
      });

      setServices(formatted);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchservices();
  }, []);

  const handleEdit = (service) => {
    setSelectedRow(service);
    setIsEditOpen(true);
  };

  const handleDelete = (service) => {
    setSelectedRow(service);
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
        `https://bcknd.sea-go.org/admin/service_type/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Service updated successfully!");
        const responseData = await response.json();

        setServices((prev) =>
          prev.map((service) =>
            service.id === id
              ? {
                  ...service,
                  name: responseData?.service?.name || name,
                  status:
                    responseData?.service?.status === 1 ? "Active" : "Inactive",
                  image_link:
                    responseData?.service?.image_link || service.image_link,
                  img: responseData?.service?.image_link ? (
                    <img
                      src={responseData.service.image_link}
                      alt={responseData?.service?.name || name}
                      className="w-12 h-12 rounded-md object-cover aspect-square"
                      onError={() => {}}
                    />
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {responseData?.service?.name?.charAt(0) ||
                          name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ),
                }
              : service
          )
        );
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update service!");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Error occurred while updating service!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/service_type/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Service deleted successfully!");
        setServices(
          services.filter((service) => service.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete service!");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error occurred while deleting service!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/service_type/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("service status updated successfully!");
        setServices((prevservices) =>
          prevservices.map((service) =>
            service.id === id
              ? { ...service, status: newStatus === 1 ? "Active" : "Inactive" }
              : service
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update service status:", errorData);
        toast.error("Failed to update service status!");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      toast.error("Error occurred while updating service status!");
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

  // --- START OF THE KEY CHANGE ---
  // Define filter options for status, now correctly grouped for DataTableLayout
  const filterOptionsForServices = [
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

  const columns = [
    { key: "name", label: "Service Name" },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={services}
        columns={columns}
        addRoute="/services/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name"]}
        showFilter={true} 
        filterKey={["status"]}
        filterOptions={filterOptionsForServices} // Pass the correctly structured options
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            columns={columns} // You might not need `columns` here for the EditDialog itself
            onChange={onChange}
          >
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Service Name
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
            name={selectedRow.name} // Assuming selectedRow.name exists for display in DeleteDialog
          />
        </>
      )}
    </div>
  );
};

export default Services;