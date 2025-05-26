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
import { Label } from "@/components/ui/label";
import MapLocationPicker from "@/components/MapLocationPicker";

const Service_provider = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [service_provider, setservice_provider] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchVillages = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/village", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const currentLang = localStorage.getItem("lang") || "en";
      const formattedVillages = (result.villages || []).map((village) => {
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
      setVillages(formattedVillages);
    } catch (err) {
      console.error("Error fetching villages:", err);
    }
  };

  const fetchServiceProviders = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/service_provider",
        {
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();

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
        const map = provider.location || "—";
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

        const villageData = villages.find((v) => v.id === provider.village_id);
        const villageName = villageData?.name || "—";

        const maintenanceTypeData = formattedMaintenanceTypes.find(
          (t) => t.id === provider.maintenance_type_id
        );
        const maintenanceTypeName = maintenanceTypeData?.name || "—";

        return {
          id: provider.id,
          name,
          rawName: name,
          map,
          description,
          img: image,
          image_link: provider.image_link, // Keep the original image link
          phone: provider.phone || "—",
          status: provider.status === 1 ? "active" : "inactive",
          village_id: provider.village_id,
          villageName,
          maintenance_type_id: provider.maintenance_type_id,
          maintenanceTypeName,
          open_from: provider.open_from || "",
          open_to: provider.open_to || "",
        };
      });

      setservice_provider(formattedProviders);
    } catch (error) {
      console.error("Error fetching service providers:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  useEffect(() => {
    if (villages.length > 0) {
      fetchServiceProviders();
    }
  }, [villages]);

  const handleEdit = (provider) => {
    if (!provider) return;
    setselectedRow({ ...provider, name: provider.rawName });
    setIsEditOpen(true);
  };

  const handleDelete = (provider) => {
    setselectedRow(provider);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const {
      id,
      rawName,
      map,
      description,
      status,
      village_id,
      phone,
      open_from,
      open_to,
      maintenance_type_id,
    } = selectedRow;

    if (!village_id || isNaN(village_id)) {
      toast.error("Village is missing or invalid.");
      return;
    }
    if (!maintenance_type_id || isNaN(maintenance_type_id)) {
      toast.error("Maintenance Type is missing or invalid.");
      return;
    }

    const updatedProvider = new FormData();
    updatedProvider.append("id", id);
    updatedProvider.append("name", rawName || "");
    updatedProvider.append("location", map);
    updatedProvider.append("description", description || "");
    updatedProvider.append("status", status === "active" ? "1" : "0");
    updatedProvider.append("phone", phone || "");
    updatedProvider.append("village_id", village_id);
    updatedProvider.append("maintenance_type_id", maintenance_type_id);

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
    };

    updatedProvider.append("open_from", formatTimeWithSeconds(open_from));
    updatedProvider.append("open_to", formatTimeWithSeconds(open_to));

    // **MODIFIED LOGIC HERE:**
    if (selectedRow.imageFile) {
      // If a new file is selected, append the new file
      updatedProvider.append("image", selectedRow.imageFile);
    } else if (selectedRow.image_link) {
      // If no new file is selected, but an old image link exists, append the old link as a string
      updatedProvider.append("image", selectedRow.image_link);
    }
    // If neither exists, don't append an image (or handle as a case where image is removed if that's a feature)

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
        fetchServiceProviders();
        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(`Failed to update provider: ${errorData.message || ""}`);
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
      if (key === "status") {
        return { ...prev, [key]: value.toLowerCase() };
      }
      if (key === "village_id" || key === "maintenance_type_id") {
        return { ...prev, [key]: parseInt(value, 10) };
      }
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
        imageFile: file, // Store the new file object
        image_link: URL.createObjectURL(file), // Update the image_link for preview
      }));
    } else {
        // If user clears the selected file, remove imageFile and reset image_link to original or null
        setselectedRow((prev) => ({
            ...prev,
            imageFile: null,
            image_link: prev.original_image_link || null // Assuming you store original_image_link
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
              ? { ...provider, status: newStatus === 1 ? "active" : "inactive" }
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

  const uniqueVillageOptions = Array.from(new Set(villages.map(v => v.name)))
    .filter(name => name && name !== "—")
    .map(name => ({ value: name, label: name }));

  const uniqueMaintenanceTypeOptions = Array.from(new Set(maintenanceTypes.map(mt => mt.name)))
    .filter(name => name && name !== "—")
    .map(name => ({ value: name, label: name }));

  const filterOptionsForServices = [
    { value: "all", label: "All" },
    ...uniqueVillageOptions,
    ...uniqueMaintenanceTypeOptions,
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const columns = [
    { key: "name", label: "Provider" },
    { key: "map", label: "Location" },
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
      <ToastContainer />
      <DataTable
        data={service_provider}
        columns={columns}
        addRoute="/maintenance-provider/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "location", "villageName", "maintenanceTypeName"]}
        showFilter={true}
        filterKey={["villageName", "maintenanceTypeName", "status"]}
        filterOptions={filterOptionsForServices}
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
              <Label htmlFor="name" className="text-gray-400 !pb-3">
                Provider Name
              </Label>
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
        {/* هنا استبدال Input بـ MapLocationPicker */}
        <MapLocationPicker
          value={selectedRow?.map || ""} // القيمة الحالية للموقع
          onChange={(newValue) => onChange("map", newValue)} // تحديث قيمة 'map'
          placeholder="Search or select location on map"
        />

              <Label htmlFor="description" className="text-gray-400 !pb-3">
                Description
              </Label>
              <Input
                label="Description"
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <Label htmlFor="maintenance_type" className="text-gray-400 !pb-3">
                Maintenance Type
              </Label>
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

              <Label htmlFor="phone" className="text-gray-400 !pb-3">
                Phone
              </Label>
              <Input
                label="Phone"
                id="phone"
                value={selectedRow?.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <Label htmlFor="open_from" className="text-gray-400 !pb-3">
                Open From
              </Label>
              <Input
                type="time"
                id="open_from"
                value={selectedRow?.open_from || ""}
                onChange={(e) => onChange("open_from", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <Label htmlFor="open_to" className="text-gray-400 !pb-3">
                Open To
              </Label>
              <Input
                type="time"
                id="open_to"
                value={selectedRow?.open_to || ""}
                onChange={(e) => onChange("open_to", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <Label htmlFor="village" className="text-gray-400 !pb-3">
                Village
              </Label>
              <Select
                value={selectedRow?.village_id?.toString()}
                onValueChange={(value) => onChange("village_id", value)}
                disabled={villages.length === 0}
              >
                <SelectTrigger
                  id="village"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select village" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {villages.length > 0 ? (
                    villages.map((v) => (
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

              <label htmlFor="image" className="text-gray-400">
                Image
              </label>

              {/* Display current image if exists */}
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