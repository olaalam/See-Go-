"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
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
import { useNavigate } from "react-router-dom";
import MapLocationPicker from "@/components/MapLocationPicker";

const Providers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoading = useSelector((state) => state.loader.isLoading);

  // Core data states
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [villages, setVillages] = useState([]);
  const [zones, setZones] = useState([]);
  const [services, setServices] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // Dialog states
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // UI states
  const [imageErrors, setImageErrors] = useState({});

  // Filter states
  const [filters, setFilters] = useState({
    zone: "all",
    village: "all",
    service: "all",
    status: "all",
  });

  // Edit pickup location state
  const [editPickUpData, setEditPickUpData] = useState({
    location_map: "",
    lat: 31.2001,
    lng: 29.9187,
  });

  // Utility functions
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result;
          if (!result) {
            reject(new Error("Failed to read file"));
            return;
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  const extractBase64FromDataURL = (dataURL) => {
    if (!dataURL || typeof dataURL !== 'string') {
      console.warn("Invalid dataURL provided:", dataURL);
      return null;
    }
    
    if (!dataURL.includes(',')) {
      return dataURL;
    }
    
    try {
      const base64Part = dataURL.split(',')[1];
      if (!base64Part) {
        console.warn("No base64 data found in dataURL");
        return null;
      }
      
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Part)) {
        console.warn("Invalid base64 format");
        return null;
      }
      
      return base64Part;
    } catch (error) {
      console.error("Error extracting base64:", error);
      return null;
    }
  };

  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error("Please select a valid image file (JPEG, PNG, GIF, WebP)");
    }

    if (file.size > maxSize) {
      throw new Error("Image file size must be less than 5MB");
    }

    return true;
  };

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Permission utilities
  const getUserPermissions = () => {
    try {
      const permissions = localStorage.getItem("userPermission");
      const parsed = permissions ? JSON.parse(permissions) : [];
      return parsed.map(perm => `${perm.module}:${perm.action}`);
    } catch (error) {
      console.error("Error parsing user permissions:", error);
      return [];
    }
  };

  const hasPermission = (permission) => {
    const match = permission.match(/^Provider(.*)$/i);
    if (!match) return false;
    const permKey = match[1].toLowerCase();
    const fullPerm = `Zone:${permKey}`;
    return permissions.includes(fullPerm);
  };

  // Event handlers
  const handleImageError = useCallback((id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatTimeWithSeconds = (time) => {
    if (!time) return "";
    return time.length === 5 ? `${time}:00` : time;
  };

  // Data fetching
  const fetchProviders = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/provider", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      // Process zones - same as Villages
      const formattedZones = (result.zones || []).map((zone) => {
        const translations = zone.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: zone.id,
          name: translations?.en?.name || zone.name,
        };
      });
      setZones(formattedZones);

      // Process villages - same as Villages
      const formattedVillages = (result.villages || []).map((village) => {
        const translations = village.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: village.id,
          name: translations?.en?.name || village.name,
          zone_id: village.zone_id,
        };
      });
      setVillages(formattedVillages);

      // Process services - same as Villages
      const formattedServices = (result.services_types || []).map((service) => {
        const translations = service.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: service.id,
          name: translations?.en?.name || service.name,
        };
      });
      setServices(formattedServices);

      // Process providers - Updated with same logic as Villages
      const processedProviders = (result.providers || []).map((provider) => {
        console.log("Processing provider:", provider.id, provider.translations); // للـ debugging
        
        // فصل الترجمات حسب اللغة والنوع - same as Villages
        const translations = provider.translations?.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {}) || {};

        console.log("Parsed translations:", translations); // للـ debugging

        // استخراج البيانات بالإنجليزي (للعرض في الجدول)
        const nameEn = translations?.en?.name || provider.name || "—";
        const descriptionEn = translations?.en?.description || provider.description || "—";
        const locationEn = translations?.en?.location || provider.location || "—";

        // استخراج البيانات بالعربي (للـ EditDialog) 
        // هنا هنتأكد إن الترجمة العربية موجودة فعلاً
        const nameAr = translations?.ar?.name || null;
        const descriptionAr = translations?.ar?.description || null;
        const locationAr = translations?.ar?.location || null;

        // Raw name for editing
        const rawName = nameEn;

        // Get related data
        const serviceObj = formattedServices.find(s => s.id === provider.service_id);
        const villageObj = formattedVillages.find(v => v.id === provider.village_id);
        const zoneObj = villageObj ? formattedZones.find(z => z.id === villageObj.zone_id) : null;

        const nameClickable = (
          <span
            onClick={() => navigate(`/providers/single-page-p/${provider.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer"
          >
            {nameEn}
          </span>
        );

        const image = provider?.image_link && !imageErrors[provider.id] ? (
          <img
            src={provider.image_link}
            alt={provider.name}
            className="w-12 h-12 rounded-md object-cover aspect-square"
            onError={() => handleImageError(provider.id)}
          />
        ) : (
          <Avatar className="w-12 h-12">
            <AvatarFallback>{nameEn?.charAt(0)}</AvatarFallback>
          </Avatar>
        );

        return {
          id: provider.id,
          name: nameClickable,
          rawName,
          nameEn: nameEn,
          description: descriptionEn,
          location: locationEn,
          // إضافة الحقول العربية (null لو مش موجودة)
          nameAr: nameAr,
          descriptionAr: descriptionAr,
          locationAr: locationAr,
          searchableName: nameEn,
          map: locationEn,
          img: image,
          status: provider.status === 1 ? "Active" : "Inactive",
          service_id: provider.service_id,
          serviceName: serviceObj?.name || "—",
          phone: provider.phone || "—",
          rating: provider.rate || "—",
          image_link: provider.image_link,
          villageName: villageObj?.name || "—",
          village_id: provider.village_id,
          zoneName: zoneObj?.name || "—",
          zone_id: zoneObj?.id,
          adminName: provider.super_admin?.name || "—",
          open_from: provider.open_from,
          open_to: provider.open_to,
          location_map: provider.location_map || "",
          lat: provider.lat || 31.2001,
          lng: provider.lng || 29.9187,
        };
      });

      setAllProviders(processedProviders);
      setProviders(processedProviders);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Error fetching providers");
    } finally {
      dispatch(hideLoader());
    }
  };

  // Filter providers using useMemo
  const filteredProviders = useMemo(() => {
    let filtered = [...allProviders];

    if (filters.zone !== "all") {
      filtered = filtered.filter(provider => provider.zoneName === filters.zone);
    }

    if (filters.village !== "all") {
      filtered = filtered.filter(provider => provider.villageName === filters.village);
    }

    if (filters.service !== "all") {
      filtered = filtered.filter(provider => provider.serviceName === filters.service);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(provider => 
        provider.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    return filtered;
  }, [allProviders, filters]);

  // Dialog handlers
  const handleEdit = (provider) => {
    if (!provider) {
      console.error("No provider data provided for editing");
      return;
    }
    
    const editableProvider = {
      ...provider,
      name: provider.rawName || provider.nameEn,
      service_id: provider.service_id ?? "",
      open_from: provider.open_from || "",
      open_to: provider.open_to || "",
      zone_id: provider.zone_id,
      village_id: provider.village_id,
    };

    setSelectedRow(editableProvider);

    // التأكد من وجود البيانات وإعطاء قيم افتراضية
    const locationData = {
      location_map: provider.location_map || provider.map || "",
      lat: provider.lat || 31.2001,
      lng: provider.lng || 29.9187,
    };
    
    console.log("Setting location data:", locationData);
    setEditPickUpData(locationData);

    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedRow(null);
    setEditPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });
  };

  useEffect(() => {
    if (selectedRow && isEditOpen) {
      const locationData = {
        location_map: selectedRow.location_map || selectedRow.map || "",
        lat: selectedRow.lat || 31.2001,
        lng: selectedRow.lng || 29.9187,
      };
      
      console.log("Syncing location data from selectedRow:", locationData);
      setEditPickUpData(locationData);
    }
  }, [selectedRow, isEditOpen]);

  const handleDelete = (provider) => {
    if (!provider) {
      console.error("No provider data provided for deletion");
      return;
    }
    
    setSelectedRow(provider);
    setIsDeleteOpen(true);
  };

  const onChange = (key, value) => {
    setSelectedRow(prev => {
      let newValue = value;
      
      if (key === "service_id" || key === "village_id" || key === "zone_id") {
        newValue = parseInt(value, 10);
      }

      // Auto-update zone when village changes
      if (key === "village_id") {
        const selectedVillage = villages.find(v => v.id === parseInt(value, 10));
        if (selectedVillage) {
          return {
            ...prev,
            [key]: newValue,
            zone_id: selectedVillage.zone_id,
            rawName: key === "name" ? value : prev.rawName,
          };
        }
      }

      return {
        ...prev,
        [key]: newValue,
        rawName: key === "name" ? value : prev.rawName,
      };
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSelectedRow(prev => ({
        ...prev,
        imageFile: null,
        imageBase64: null,
        newImageBase64: null,
        image_link: prev.image_link,
        hasNewImage: false,
      }));
      return;
    }

    try {
      validateImageFile(file);

      const dataURL = await convertFileToBase64(file);
      const base64Only = extractBase64FromDataURL(dataURL);
      
      if (!base64Only) {
        throw new Error("Failed to extract base64 data from image");
      }

      const previewURL = URL.createObjectURL(file);
      
      setSelectedRow(prev => ({
        ...prev,
        imageFile: file,
        imageBase64: dataURL,
        newImageBase64: base64Only,
        image_link: previewURL,
        hasNewImage: true,
      }));

      console.log("Image processed successfully:", {
        fileName: file.name,
        fileSize: file.size,
        base64Length: base64Only.length,
      });

    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(error.message || 'Error processing image file');
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const {
      id, name, description, location, nameAr, descriptionAr, locationAr, status, service_id, village_id, zone_id,
      phone, open_from, open_to, newImageBase64, hasNewImage
    } = selectedRow;

    if (!hasPermission("ProviderEdit")) {
      toast.error("You don't have permission to edit providers");
      return;
    }

    // Validation
    if (!village_id || isNaN(parseInt(village_id, 10))) {
      toast.error("Village ID is missing or invalid");
      return;
    }
    if (!service_id || isNaN(parseInt(service_id, 10))) {
      toast.error("Service ID is missing or invalid");
      return;
    }
    if (!zone_id || isNaN(parseInt(zone_id, 10))) {
      toast.error("Zone ID is missing or invalid");
      return;
    }

    const updatedProvider = {
      id,
      name: name || "",
      location: location || "",
      description: description || "",
      status: status === "Active" ? "1" : "0",
      service_id: parseInt(service_id, 10),
      phone: phone || "",
      village_id: parseInt(village_id, 10),
      zone_id: parseInt(zone_id, 10),
      lat: editPickUpData.lat.toString(),
      lng: editPickUpData.lng.toString(),
      location_map: editPickUpData.location_map,
      open_from: formatTimeWithSeconds(open_from),
      open_to: formatTimeWithSeconds(open_to),
    };

    // إضافة الحقول العربية بس لو موجودة أصلاً في الداتا - same logic as Villages
    if (selectedRow.nameAr !== null && selectedRow.nameAr !== undefined) {
      updatedProvider.ar_name = nameAr || "";
    }
    if (selectedRow.descriptionAr !== null && selectedRow.descriptionAr !== undefined) {
      updatedProvider.ar_description = descriptionAr || "";
    }
    if (selectedRow.locationAr !== null && selectedRow.locationAr !== undefined) {
      updatedProvider.ar_location = locationAr || "";
    }

    if (hasNewImage && newImageBase64) {
      console.log("Adding new image to update data, base64 length:", newImageBase64.length);
      updatedProvider.image = selectedRow.imageBase64;
    }

    // للـ debugging - شوفي إيه اللي بيتبعت
    console.log("Sending update data:", {
      ...updatedProvider,
      image: updatedProvider.image ? `[base64 data: ${updatedProvider.image.length} chars]` : 'no image'
    });

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedProvider),
        }
      );

      const responseData = await response.json();
      
      if (response.ok) {
        toast.success("Provider updated successfully!");
        await fetchProviders();
        handleCloseEdit();
      } else {
        console.error("Update failed:", responseData);
        
        if (responseData.errors && responseData.errors.image) {
          toast.error("Image validation failed: " + responseData.errors.image.join(", "));
        } else {
          toast.error(responseData.message || "Failed to update provider!");
        }
      }
    } catch (error) {
      console.error("Error occurred while updating provider:", error);
      toast.error("Network error occurred while updating provider!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    if (!hasPermission("ProviderDelete")) {
      toast.error("You don't have permission to delete providers");
      return;
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Provider deleted successfully!");
        setAllProviders(prev => prev.filter(provider => provider.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to delete provider!");
      }
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Error occurred while deleting provider!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    if (!row || !row.id) {
      console.error("Invalid row data for status toggle");
      toast.error("Invalid provider data");
      return;
    }

    if (!hasPermission("ProviderStatus")) {
      toast.error("You don't have permission to change provider status");
      return;
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/status/${row.id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Provider status updated successfully!");
        setAllProviders(prev =>
          prev.map(provider =>
            provider.id === row.id
              ? { ...provider, status: newStatus === 1 ? "Active" : "Inactive" }
              : provider
          )
        );
      } else {
        toast.error("Failed to update provider status!");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error occurred while updating provider status!");
    }
  };

  // Effects
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    setProviders(filteredProviders);
  }, [filteredProviders]);

  // Table configuration
  const columns = [
    { key: "name", label: "Provider" },
    { key: "img", label: "Image" },
    { key: "zoneName", label: "Zone" },
    { key: "serviceName", label: "Service" },
    { key: "villageName", label: "Village" },
    { key: "adminName", label: "Admin Name" },
    { key: "phone", label: "Phone" },
    { key: "map", label: "Location" },
    { key: "status", label: "Status" },
  ];

  const filterOptions = [
    {
      key: "zoneName",
      label: "Zone",
      options: [
        { value: "all", label: "All Zones" },
        ...zones.map(zone => ({ value: zone.name, label: zone.name })),
      ],
    },
    {
      key: "villageName",
      label: "Village",
      options: [
        { value: "all", label: "All Villages" },
        ...villages.map(village => ({ value: village.name, label: village.name })),
      ],
    },
    {
      key: "serviceName",
      label: "Service",
      options: [
        { value: "all", label: "All Services" },
        ...services.map(service => ({ value: service.name, label: service.name })),
      ],
    },
    {
      key: "adminName",
      label: "Admin Name",
      options: [
        { value: "all", label: "All Admins" },
        ...Array.from(new Set(allProviders.map(p => p.adminName).filter(Boolean)))
          .map(name => ({ value: name, label: name })),
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

  return (
    <div className="p-6">
      {isLoading && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} />

      <DataTable
        data={providers}
        columns={columns}
        showAddButton={hasPermission("ProviderAdd")}
        addRoute="/providers/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["searchableName", "serviceName", "location", "villageName", "zoneName"]}
        showEditButton={hasPermission("ProviderEdit")}
        showDeleteButton={hasPermission("ProviderDelete")}
        showActions={hasPermission("ProviderEdit") || hasPermission("ProviderDelete")}
        showFilter={true}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={handleCloseEdit}
            onSave={handleSave}
            selectedRow={selectedRow}
            zones={zones}
            village={villages}
            services={services}
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* الحقول الإنجليزية */}
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Provider Name (English)
              </label>
              <Input
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
                required
              />

              <label htmlFor="description" className="text-gray-400 !pb-3">
                Description (English)
              </label>
              <Input
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="location" className="text-gray-400 !pb-3">
                Location (English)
              </label>
              <MapLocationPicker
                key={selectedRow?.id}
                value={editPickUpData.location_map}
                onChange={(newValue, coordinates) => {
                  setEditPickUpData(prev => ({
                    ...prev,
                    location_map: newValue,
                    lat: coordinates?.lat || prev.lat,
                    lng: coordinates?.lng || prev.lng,
                  }));
                  onChange("location", newValue);
                }}
                initialCoordinates={{
                  lat: editPickUpData.lat,
                  lng: editPickUpData.lng,
                }}
                placeholder="Search or select location on map"
              />

              {/* الحقول العربية - بس لو الـ provider أصلاً له ترجمة عربية */}
              {(selectedRow?.nameAr !== null && selectedRow?.nameAr !== undefined) && (
                <>
                  <label htmlFor="nameAr" className="text-gray-400 !pb-3">
                    اسم مزود الخدمة (عربي)
                  </label>
                  <Input
                    id="nameAr"
                    value={selectedRow?.nameAr || ""}
                    onChange={(e) => onChange("nameAr", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                    dir="rtl"
                    placeholder="اسم مزود الخدمة بالعربي"
                  />
                </>
              )}

              {(selectedRow?.descriptionAr !== null && selectedRow?.descriptionAr !== undefined) && (
                <>
                  <label htmlFor="descriptionAr" className="text-gray-400 !pb-3">
                    الوصف (عربي)
                  </label>
                  <Input
                    id="descriptionAr"
                    value={selectedRow?.descriptionAr || ""}
                    onChange={(e) => onChange("descriptionAr", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                    dir="rtl"
                    placeholder="وصف مزود الخدمة بالعربي"
                  />
                </>
              )}

              {(selectedRow?.locationAr !== null && selectedRow?.locationAr !== undefined) && (
                <>
                  <label htmlFor="locationAr" className="text-gray-400 !pb-3">
                    الموقع (عربي)
                  </label>
                  <Input
                    id="locationAr"
                    value={selectedRow?.locationAr || ""}
                    onChange={(e) => onChange("locationAr", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                    dir="rtl"
                    placeholder="موقع مزود الخدمة بالعربي"
                  />
                </>
              )}

              <label htmlFor="zone" className="text-gray-400 !pb-3">
                Zone
              </label>
              <Select
                value={selectedRow?.zone_id?.toString() || ""}
                onValueChange={(value) => onChange("zone_id", value)}
                disabled={zones.length === 0}
              >
                <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {zones.length > 0 ? (
                    zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-zones" disabled>
                      No zones available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <label htmlFor="description" className="text-gray-400 !pb-3">
                Description
              </label>
              <Input
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="phone" className="text-gray-400 !pb-3">
                Phone
              </label>
              <Input
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

              <label htmlFor="service" className="text-gray-400 !pb-3">
                Service
              </label>
              <Select
                value={selectedRow?.service_id?.toString() || ""}
                onValueChange={(value) => onChange("service_id", value)}
                disabled={services.length === 0}
              >
                <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-services" disabled>
                      No services available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <label htmlFor="village" className="text-gray-400 !pb-3">
                Village
              </label>
              <Select
                value={selectedRow?.village_id?.toString() || ""}
                onValueChange={(value) => onChange("village_id", value)}
                disabled={villages.length === 0}
              >
                <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                  <SelectValue placeholder="Select village" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {villages.length > 0 ? (
                    villages.map((village) => (
                      <SelectItem key={village.id} value={village.id.toString()}>
                        {village.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-villages" disabled>
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
            name={selectedRow.rawName || selectedRow.name}
          />
        </>
      )}
    </div>
  );
};

export default Providers;