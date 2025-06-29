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
  const [permissions, setPermissions] = useState([]);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });
  // Edit location state
  const [editLocationData, setEditLocationData] = useState({
    location_map: "",
    lat: 31.2001,
    lng: 29.9187,
  })
  // Helper to convert URL to Base64
  const imageUrlToBase64 = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch image from URL: ${url}, status: ${response.status}`);
        return null;
      }
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image URL to Base64:", error);
      return null;
    }
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
    const match = permission.match(/^Provider Maintenance(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Provider Maintenance:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  const fetchVillages = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/village", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      
      const formattedVillages = (result.villages || []).map((village) => {
        const translations = village.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: village.id,
          name: translations?.en?.name || village.name,
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

      const formattedMaintenanceTypes = (result.maintenance_types || []).map(
        (type) => {
          const translations = type.translations.reduce((acc, t) => {
            if (!acc[t.locale]) acc[t.locale] = {};
            acc[t.locale][t.key] = t.value;
            return acc;
          }, {});
          return {
            id: type.id,
            name: translations?.en?.name || type.name,
          };
        }
      );
      setMaintenanceTypes(formattedMaintenanceTypes);

      // Map providers and convert existing images to Base64
      const formattedProviders = await Promise.all(
        (result.providers || []).map(async (provider) => {
          console.log("Processing provider:", provider.id, provider.translations);
          
          // فصل الترجمات حسب اللغة والنوع - same as villages
          const translations = provider.translations.reduce((acc, t) => {
            if (!acc[t.locale]) acc[t.locale] = {};
            acc[t.locale][t.key] = t.value;
            return acc;
          }, {});

          console.log("Parsed translations:", translations);

          // استخراج البيانات بالإنجليزي (للعرض في الجدول)
          const nameEn = translations?.en?.name || provider.name || "—";
          const descriptionEn = translations?.en?.description || provider.description || "—";

          // استخراج البيانات بالعربي (للـ EditDialog)
          const nameAr = translations?.ar?.name || null;
          const descriptionAr = translations?.ar?.description || null;

          const map = provider.location || "—";
          
          let originalImageBase64 = null;
          if (provider.image_link) {
            originalImageBase64 = await imageUrlToBase64(provider.image_link);
          }

          const image = provider?.image_link ? (
            <img
              src={provider.image_link}
              alt={nameEn}
              className="w-12 h-12 rounded-md object-cover aspect-square"
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{nameEn?.charAt(0)}</AvatarFallback>
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
            name: nameEn,
            rawName: nameEn,
            // إضافة الحقول العربية
            nameAr: nameAr,
            descriptionAr: descriptionAr,
            map,
            description: descriptionEn,
            img: image,
            image_link: provider.image_link,
            original_image_link: provider.image_link,
            originalImageBase64: originalImageBase64,
            phone: provider.phone || "—",
            status: provider.status === 1 ? "active" : "inactive",
            village_id: provider.village_id,
            villageName,
            maintenance_type_id: provider.maintenance_type_id,
            maintenanceTypeName,
            open_from: provider.open_from || "",
            open_to: provider.open_to || "",
                      location_map: provider.location_map || "",
          lat: provider.lat || 31.2001,
          lng: provider.lng || 29.9187,
          };
        })
      );

      setservice_provider(formattedProviders);
    } catch (error) {
      console.error("Error fetching service providers:", error);
      toast.error("Failed to load service providers.");
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
        // التأكد من وجود البيانات وإعطاء قيم افتراضية
    const locationData = {
      location_map: provider.location_map || provider.map || "",
      lat: provider.lat || 31.2001,
      lng: provider.lng || 29.9187,
    };
        console.log("Setting location data:", locationData);
    setEditLocationData(locationData);
  };

  const handleDelete = (provider) => {
    setselectedRow(provider);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    if (!hasPermission("Provider MaintenanceEdit")) {
      toast.error("You don't have permission to edit Provider Maintenance");
      return;
    }
    
    const {
      id,
      rawName,
      nameAr,
      descriptionAr,
      map,
      description,
      status,
      village_id,
      phone,
      open_from,
      open_to,
      maintenance_type_id,
      imageFileBase64,
      originalImageBase64,
      image_link,
      original_image_link,
    } = selectedRow;

    if (!village_id || isNaN(village_id)) {
      toast.error("Village is missing or invalid.");
      return;
    }
    if (!maintenance_type_id || isNaN(maintenance_type_id)) {
      toast.error("Maintenance Type is missing or invalid.");
      return;
    }

    const updatedProvider = {
      id,
      name: rawName || "",
      description: description || "",
      location: map,
      status: status === "active" ? 1 : 0,
      phone: phone || "",
      village_id: village_id,
      maintenance_type_id: maintenance_type_id,
      open_from: formatTimeWithSeconds(open_from),
      open_to: formatTimeWithSeconds(open_to),
            lat: editLocationData.lat.toString(),
      lng: editLocationData.lng.toString(),
      location_map: editLocationData.location_map,
    };

    // إضافة الحقول العربية بس لو موجودة أصلاً في الداتا
    if (selectedRow.nameAr !== null && selectedRow.nameAr !== undefined) {
      updatedProvider.ar_name = nameAr || "";
    }
    if (selectedRow.descriptionAr !== null && selectedRow.descriptionAr !== undefined) {
      updatedProvider.ar_description = descriptionAr || "";
    }

    // Image handling logic
    if (imageFileBase64) {
      updatedProvider.image = imageFileBase64;
    } else if (image_link && image_link === original_image_link && originalImageBase64) {
      updatedProvider.image = originalImageBase64;
    } else if (!image_link && original_image_link) {
      updatedProvider.image = null;
    }

    try {
      dispatch(showLoader());
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/service_provider/update/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedProvider),
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
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow?.id) return;
    if (!hasPermission("Provider MaintenanceDelete")) {
      toast.error("You don't have permission to delete Provider Maintenance");
      return;
    }
    try {
      dispatch(showLoader());
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
    } finally {
      dispatch(hideLoader());
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setselectedRow((prev) => ({
          ...prev,
          imageFileBase64: reader.result,
          image_link: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setselectedRow((prev) => ({
        ...prev,
        imageFileBase64: null,
        image_link: prev.original_image_link || null,
      }));
    }
  };

  const formatTimeWithSeconds = (time) => {
    if (!time) return "";
    return time.length === 5 ? `${time}:00` : time;
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    if (!hasPermission("Provider MaintenanceStatus")) {
      toast.error(
        "You don't have permission to change Provider Maintenance status"
      );
      return;
    }
    try {
      dispatch(showLoader());
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
    } finally {
      dispatch(hideLoader());
    }
  };

  const uniqueVillageOptions = Array.from(new Set(villages.map((v) => v.name)))
    .filter((name) => name && name !== "—")
    .map((name) => ({ value: name, label: name }));

  const uniqueMaintenanceTypeOptions = Array.from(
    new Set(maintenanceTypes.map((mt) => mt.name))
  )
    .filter((name) => name && name !== "—")
    .map((name) => ({ value: name, label: name }));

  const filterOptionsForServices = [
    {
      key: "villageName",
      label: "Village",
      options: [
        { value: "all", label: "All Villages" },
        ...uniqueVillageOptions,
      ],
    },
    {
      key: "maintenanceTypeName",
      label: "Maintenance Type",
      options: [
        { value: "all", label: "All Types" },
        ...uniqueMaintenanceTypeOptions,
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
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
  
  useEffect(() => {
    if (selectedRow && isEditOpen) {
      const locationData = {
        location_map: selectedRow.location_map || selectedRow.map || "",
        lat: selectedRow.lat || 31.2001,
        lng: selectedRow.lng || 29.9187,
      };
      
      console.log("Syncing location data from selectedRow:", locationData);
      setEditLocationData(locationData);
    }
  }, [selectedRow, isEditOpen]);

  return (
    <div>
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={service_provider}
        columns={columns}
        showAddButton={hasPermission("Provider MaintenanceAdd")}
        addRoute="/maintenance-provider/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "location", "villageName", "maintenanceTypeName"]}
        showFilter={true}
        showEditButton={hasPermission("Provider MaintenanceEdit")}
        showDeleteButton={hasPermission("Provider MaintenanceDelete")}
        showActions={hasPermission("Provider MaintenanceEdit") || hasPermission("Provider MaintenanceDelete")}
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
              
              {/* الحقول الإنجليزية */}
              <Label htmlFor="name" className="text-gray-400 !pb-3">
                Provider Name (English)
              </Label>
              <Input
                label="Provider Name"
                id="name"
                value={selectedRow?.rawName || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <Label htmlFor="description" className="text-gray-400 !pb-3">
                Description (English)
              </Label>
              <Input
                label="Description"
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              {/* الحقول العربية - بس لو الـ provider أصلاً له ترجمة عربية */}
              {(selectedRow?.nameAr !== null && selectedRow?.nameAr !== undefined) && (
                <>
                  <Label htmlFor="nameAr" className="text-gray-400 !pb-3">
                    اسم المزود (عربي)
                  </Label>
                  <Input
                    id="nameAr"
                    value={selectedRow?.nameAr || ""}
                    onChange={(e) => onChange("nameAr", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                    dir="rtl"
                    placeholder="اسم المزود بالعربي"
                  />
                </>
              )}

              {(selectedRow?.descriptionAr !== null && selectedRow?.descriptionAr !== undefined) && (
                <>
                  <Label htmlFor="descriptionAr" className="text-gray-400 !pb-3">
                    الوصف (عربي)
                  </Label>
                  <Input
                    id="descriptionAr"
                    value={selectedRow?.descriptionAr || ""}
                    onChange={(e) => onChange("descriptionAr", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                    dir="rtl"
                    placeholder="وصف المزود بالعربي"
                  />
                </>
              )}

              <label htmlFor="location" className="text-gray-400 !pb-3">
                Location
              </label>
              <MapLocationPicker
                value={selectedRow?.map || ""}
                onChange={(newValue) => onChange("map", newValue)}
                placeholder="Search or select location on map"
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