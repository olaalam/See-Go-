"use client";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const Service_provider = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [service_provider, setservice_provider] = useState([]);
  const [village, setVillage] = useState([]);
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchVillage = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/village", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      console.log("Village API response:", result);
      const currentLang = localStorage.getItem("lang") || "en";
      const formattedvillage = (result.villages || []).map((village) => {
        const translations = village.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: village.id,
          name: translations[currentLang]?.name || village.name,
        };
      });
      console.log("Formatted villages:", formattedvillage);
      setVillage(formattedvillage);
    } catch (err) {
      console.error("Error fetching village:", err);
    }
  };

  const fetchservice_provider = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/service_provider",
        {
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();
      console.log("API response:", result);

      const currentLang = localStorage.getItem("lang") || "en";

      const formattedMaintenanceTypes = (result.maintenance_types || []).map(
        (type) => {
          const translations = type.translations.reduce((acc, t) => {
            if (!acc[t.locale]) acc[t.locale] = {};
            acc[t.locale][t.key] = t.value;
            return acc;
          }, {});
          return {
            id: type.id,
            name: translations[currentLang]?.name || type.name,
          };
        }
      );

      setMaintenanceTypes(formattedMaintenanceTypes);

      const formattedProviders = (result.providers || []).map((provider) => {
        const translations = provider.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || provider.name || "—";
        const location =
          translations[currentLang]?.location || provider.location || "—";
        const description =
          translations[currentLang]?.description || provider.description || "—";
        const image = provider?.image_link ? (
          <img
            src={provider.image_link}
            alt={name}
            className="w-12 h-12 rounded-md object-cover aspect-square"
          />
        ) : (
          <Avatar className="w-12 h-12">
            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
          </Avatar>
        );

        const villageData = village.find((v) => v.id === provider.village_id);
        const villageName = villageData?.name || "—";

        const maintenanceTypeData = formattedMaintenanceTypes.find(
          (t) => t.id === provider.maintenance_type_id
        );
        const maintenanceTypeName = maintenanceTypeData?.name || "—";

        return {
          id: provider.id,
          name,
          rawName: name,
          location,
          description,
          img: image,
          phone: provider.phone || "—",
          status: provider.status === 1 ? "Active" : "Inactive",
          village_id: provider.village_id,
          villageName,
          maintenance_type_id: provider.maintenance_type_id,
          maintenanceTypeName,
        };
      });

      setservice_provider(formattedProviders);
    } catch (error) {
      console.error("Error fetching service_provider:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchVillage();
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (village.length > 0) {
      fetchservice_provider();
    }
  }, [village]);

  const handleEdit = (provider) => {
    if (!provider) return;
    setselectedRow({ ...provider, name: provider.rawName });
    setIsEditOpen(true);
  };

  const handleDelete = (provider) => {
    console.log("Deleting provider:", provider);
    setselectedRow(provider);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    if (isEditOpen && selectedRow) {
      console.log("selectedRow data for edit:", selectedRow);
    }
  }, [isEditOpen, selectedRow]);

  const handleSave = async () => {
    if (!selectedRow) return;

    const {
      id,
      rawName,
      location,
      description,
      status,
      village_id,
      phone,
      imageFile,
      open_from,
      open_to,
      maintenance_type_id,
    } = selectedRow;

    if (!village_id || isNaN(village_id)) {
      toast.error("Village ID is missing or invalid");
      return;
    }

    const updatedProvider = new FormData();
    updatedProvider.append("id", id);
    updatedProvider.append("name", rawName || "");
    updatedProvider.append("location", location || "");
    updatedProvider.append("description", description || "");
    updatedProvider.append("status", status === "Active" ? "1" : "0");
    updatedProvider.append("phone", phone || "");
    updatedProvider.append("village_id", village_id);
    updatedProvider.append("maintenance_type_id", maintenance_type_id);

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
    };

    updatedProvider.append("open_from", formatTimeWithSeconds(open_from));
    updatedProvider.append("open_to", formatTimeWithSeconds(open_to));

    if (imageFile) {
      updatedProvider.append("image", imageFile);
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/service_provider/update/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updatedProvider,
        }
      );

      if (response.ok) {
        toast.success("Provider updated successfully!");
        const responseData = await response.json();

        setservice_provider((prev) =>
          prev.map((provider) =>
            provider.id === id
              ? {
                  ...provider,
                  name: responseData?.provider?.name || rawName,
                  rawName: responseData?.provider?.name || rawName,
                  status:
                    responseData?.provider?.status === 1
                      ? "Active"
                      : "Inactive",
                  image_link:
                    responseData?.provider?.image_link || provider.image_link,
                  phone: responseData?.provider?.phone,
                  village_id: parseInt(village_id),
                  villageName:
                    village.find((v) => v.id === parseInt(village_id))?.name ||
                    provider.villageName,
                  img: responseData?.provider?.image_link ? (
                    <img
                      src={responseData.provider.image_link}
                      alt={responseData?.provider?.name || rawName}
                      className="w-12 h-12 rounded-md object-cover aspect-square"
                      onError={() => {}}
                    />
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {responseData?.provider?.name?.charAt(0) ||
                          rawName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ),
                  location: responseData?.provider?.location || location,
                  description:
                    responseData?.provider?.description || description,
                  open_from: responseData?.provider?.open_from || open_from,
                  open_to: responseData?.provider?.open_to || open_to,
                }
              : provider
          )
        );

        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update provider!");
      }
    } catch (error) {
      console.error("Error updating provider:", error);
      toast.error("Error occurred while updating provider!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow?.id) return;
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/service_provider/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        toast.success("Provider deleted successfully!");
        setservice_provider(
          service_provider.filter((provider) => provider.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete provider!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting provider!", error);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => {
      if (key === "name") {
        return { ...prev, rawName: value };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setselectedRow((prev) => ({
        ...prev,
        imageFile: file,
      }));
    }
  };
  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        toast.success("Provider status updated successfully!");
        setservice_provider((prevservice_provider) =>
          prevservice_provider.map((provider) =>
            provider.id === id
              ? { ...provider, status: newStatus === 1 ? "Active" : "Inactive" }
              : provider
          )
        );
      } else {
        toast.error("Failed to update provider status!");
      }
    } catch (error) {
      toast.error("Error occurred while updating provider status!", error);
    }
  };

  const columns = [
    { key: "name", label: "Provider" },
    { key: "location", label: "Location" },
    { key: "description", label: "Description" },
    { key: "villageName", label: "Village" },
    { key: "maintenanceTypeName", label: "Maintenance Type" },
    { key: "img", label: "Image" },
    { key: "phone", label: "Phone" },
    { key: "status", label: "Status" },
  ];

  return (
    <div>
      {isLoading && <FullPageLoader />}
      <DataTable
        data={service_provider}
        columns={columns}
        addRoute="/service-provider/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "location", "villageName"]}
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
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Provider Name
              </label>
              <Input
                label="Provider Name"
                id="name"
                value={selectedRow?.rawName || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="location" className="text-gray-400 !pb-3">
                Location
              </label>
              <Input
                label="Location"
                id="location"
                value={selectedRow?.location || ""}
                onChange={(e) => onChange("location", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="description" className="text-gray-400 !pb-3">
                Description
              </label>
              <Input
                label="Description"
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="maintenance_type" className="text-gray-400 !pb-3">
                Maintenance Type
              </label>
              <Select
                value={selectedRow?.maintenance_type_id?.toString()}
                onValueChange={(value) =>
                  onChange("maintenance_type_id", parseInt(value))
                }
                disabled={maintenanceTypes.length === 0}
              >
                <SelectTrigger
                  id="maintenance_type"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {maintenanceTypes.length > 0 ? (
                    maintenanceTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id.toString()}
                        className="text-bg-primary"
                      >
                        {type.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={null} disabled>
                      No maintenance types available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <label htmlFor="phone" className="text-gray-400 !pb-3">
                Phone
              </label>
              <Input
                label="Phone"
                id="phone"
                value={selectedRow?.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="open_from" className="text-gray-400 !pb-3">
                Open From
              </label>
              <Input
                type="time"
                id="open_from"
                value={selectedRow?.open_from || ""}
                onChange={(e) => onChange("open_from", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="open_to" className="text-gray-400 !pb-3">
                Open To
              </label>
              <Input
                type="time"
                id="open_to"
                value={selectedRow?.open_to || ""}
                onChange={(e) => onChange("open_to", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="village" className="text-gray-400 !pb-3">
                Village
              </label>
              <Select
                value={selectedRow?.village_id?.toString()}
                onValueChange={(value) => onChange("village_id", value)}
                disabled={village.length === 0}
              >
                <SelectTrigger
                  id="village"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select village" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {village.length > 0 ? (
                    village.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={v.id.toString()}
                        className="text-bg-primary"
                      >
                        {v.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem
                      value={null}
                      className="text-bg-primary"
                      disabled
                    >
                      No villages available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <label htmlFor="image" className="text-gray-400 !pb-3">
                Image
              </label>
              <Input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="!my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
              />
            </div>
          </EditDialog>
          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.rawName}
          />

          <ToastContainer position="top-right" autoClose={3000} />
        </>
      )}
    </div>
  );
};

export default Service_provider;
