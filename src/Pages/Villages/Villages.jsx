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
import InvoiceDialog from "@/components/InvoiceDialog";
import MapLocationPicker from "@/components/MapLocationPicker";

const Villages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoading = useSelector((state) => state.loader.isLoading);

  // Core data states
  const [villages, setVillages] = useState([]);
  const [allVillages, setAllVillages] = useState([]);
  const [zones, setZones] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // Dialog states
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceVillageId, setInvoiceVillageId] = useState(null);

  // UI states
  const [imageErrors, setImageErrors] = useState({});

  // Filter states
  const [filters, setFilters] = useState({
    zone: "all",
    status: "all",
  });

  // Edit location state
  const [editLocationData, setEditLocationData] = useState({
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
    const match = permission.match(/^Villages(.*)$/i);
    if (!match) return false;
    const permKey = match[1].toLowerCase();
    const fullPerm = `Village:${permKey}`;
    return permissions.includes(fullPerm);
  };

  // Event handlers
  const handleImageError = useCallback((id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Data fetching
  const fetchZones = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/zone", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const formattedZones = result.zones.map((zone) => {
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
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchVillages = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/village", {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (!result || !result.villages || !Array.isArray(result.villages)) {
        console.error("Invalid API response structure:", result);
        setAllVillages([]);
        setVillages([]);
        return;
      }

      const formatted = result.villages.map((village) => {
        console.log("Processing village:", village.id, village.translations); // للـ debugging
        
        // فصل الترجمات حسب اللغة والنوع - same as zones
        const translations = village.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        console.log("Parsed translations:", translations); // للـ debugging

        // استخراج البيانات بالإنجليزي (للعرض في الجدول)
        const nameEn = translations?.en?.name || village.name || "—";
        const descriptionEn = translations?.en?.description || village.description || "—";

        // استخراج البيانات بالعربي (للـ EditDialog) 
        // هنا هنتأكد إن الترجمة العربية موجودة فعلاً
        const nameAr = translations?.ar?.name || null;
        const descriptionAr = translations?.ar?.description || null;

        // Raw name for editing
        const rawName = nameEn;

        const nameClickable = (
          <span
            onClick={() => navigate(`/villages/single-page-v/${village.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer"
          >
            {nameEn}
          </span>
        );

        // Get zone information
        const zoneObj = zones.find(z => z.id === village.zone_id);
        const zoneName = zoneObj?.name || 
          village.zone?.translations?.find(
            (t) => t.locale === "en" && t.key === "name"
          )?.value ||
          village.zone?.name ||
          "—";

        const image =
          village?.image_link && !imageErrors[village.id] ? (
            <img
              src={village?.image_link}
              alt={nameEn}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(village.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{nameEn?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        const map = village.location || "—";
        const population = village.population_count || "—";

        return {
          id: village.id,
          name: nameClickable,
          rawName,
          nameEn: nameEn,
          description: descriptionEn,
          // إضافة الحقول العربية (null لو مش موجودة)
          nameAr: nameAr,
          descriptionAr: descriptionAr,
          searchableName: nameEn,
          img: image,
          numberOfUnits: village.units_count ?? 0,
          status: village.status === 1 ? "active" : "inactive",
          zone_id: village.zone_id,
          zone: zoneName,
          searchableZone: zoneName,
          map,
          population,
          image_link: village.image_link,
          location_map: village.location_map || "",
          lat: village.lat || 31.2001,
          lng: village.lng || 29.9187,
        };
      });
      
      setAllVillages(formatted);
      setVillages(formatted);
    } catch (error) {
      console.error("Error fetching villages:", error);
      toast.error("Failed to fetch villages data");
      setAllVillages([]);
      setVillages([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  // Filter villages using useMemo
  const filteredVillages = useMemo(() => {
    let filtered = [...allVillages];

    if (filters.zone !== "all") {
      filtered = filtered.filter(village => village.searchableZone === filters.zone);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(village => village.status === filters.status);
    }

    return filtered;
  }, [allVillages, filters]);

  // Dialog handlers
  const handleEdit = (village) => {
    if (!village) {
      console.error("No village data provided for editing");
      return;
    }
    
    const editableVillage = {
      ...village,
      name: village.rawName || village.nameEn,
      numberOfUnits: Number(village.numberOfUnits) || 0,
    };
    
    setSelectedRow(editableVillage);
    
    // التأكد من وجود البيانات وإعطاء قيم افتراضية
    const locationData = {
      location_map: village.location_map || village.map || "",
      lat: village.lat || 31.2001,
      lng: village.lng || 29.9187,
    };
    
    console.log("Setting location data:", locationData);
    setEditLocationData(locationData);
    
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedRow(null);
    setEditLocationData({ location_map: "", lat: 31.2001, lng: 29.9187 });
  };

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

  const handleDelete = (village) => {
    if (!village) {
      console.error("No village data provided for deletion");
      return;
    }
    
    setSelectedRow(village);
    setIsDeleteOpen(true);
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]:
        key === "zone_id" || key === "numberOfUnits"
          ? parseInt(value, 10) || 0
          : value,
    }));
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

    if (!hasPermission("VillagesEdit")) {
      toast.error("You don't have permission to edit villages");
      return;
    }

    const { id, name, description, nameAr, descriptionAr, status, zone_id, numberOfUnits, newImageBase64, hasNewImage } = selectedRow;

    // Validation
    if (!id) {
      toast.error("Village ID is missing");
      return;
    }

    if (!zone_id || isNaN(zone_id)) {
      toast.error("Zone ID is missing or invalid");
      return;
    }

    if (!name || name.trim() === "") {
      toast.error("Village name is required");
      return;
    }

    const parsedNumberOfUnits = parseInt(numberOfUnits, 10);
    if (isNaN(parsedNumberOfUnits) || parsedNumberOfUnits < 0) {
      toast.error("Number of Units must be a valid positive number");
      return;
    }

    const updatedVillage = {
      id,
      name: name.trim(),
      description: description || "",
      status: status === "active" ? "1" : "0",
      zone_id: parseInt(zone_id, 10),
      location: editLocationData.location_map,
      units_count: parsedNumberOfUnits,
      lat: editLocationData.lat.toString(),
      lng: editLocationData.lng.toString(),
      location_map: editLocationData.location_map,
    };

    // إضافة الحقول العربية بس لو موجودة أصلاً في الداتا - same logic as zones
    if (selectedRow.nameAr !== null && selectedRow.nameAr !== undefined) {
      updatedVillage.ar_name = nameAr || "";
    }
    if (selectedRow.descriptionAr !== null && selectedRow.descriptionAr !== undefined) {
      updatedVillage.ar_description = descriptionAr || "";
    }

    if (hasNewImage && newImageBase64) {
      console.log("Adding new image to update data, base64 length:", newImageBase64.length);
      updatedVillage.image = selectedRow.imageBase64;
    }

    // للـ debugging - شوفي إيه اللي بيتبعت
    console.log("Sending update data:", {
      ...updatedVillage,
      image: updatedVillage.image ? `[base64 data: ${updatedVillage.image.length} chars]` : 'no image'
    });

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedVillage),
        }
      );

      const responseData = await response.json();
      
      if (response.ok) {
        toast.success("Village updated successfully!");
        await fetchVillages();
        handleCloseEdit();
      } else {
        console.error("Update failed:", responseData);
        
        if (responseData.errors && responseData.errors.image) {
          toast.error("Image validation failed: " + responseData.errors.image.join(", "));
        } else {
          toast.error(responseData.message || "Failed to update village!");
        }
      }
    } catch (error) {
      console.error("Error occurred while updating village:", error);
      toast.error("Network error occurred while updating village!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    if (!hasPermission("VillagesDelete")) {
      toast.error("You don't have permission to delete villages");
      return;
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Village deleted successfully!");
        setAllVillages(prev => prev.filter(village => village.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to delete village!");
      }
    } catch (error) {
      console.error("Error occurred while deleting village!", error);
      toast.error("Error occurred while deleting village!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    if (!row || !row.id) {
      console.error("Invalid row data for status toggle");
      toast.error("Invalid village data");
      return;
    }

    if (!hasPermission("VillagesStatus")) {
      toast.error("You don't have permission to change village status");
      return;
    }

    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Village status updated successfully!");
        setAllVillages(prev =>
          prev.map(village =>
            village.id === id
              ? { ...village, status: newStatus === 1 ? "active" : "inactive" }
              : village
          )
        );
      } else {
        toast.error("Failed to update village status!");
      }
    } catch (error) {
      console.error("Error occurred while updating village status!", error);
      toast.error("Error occurred while updating village status!");
    }
  };

  // Effects
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchVillages(), fetchZones()]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setVillages(filteredVillages);
  }, [filteredVillages]);

  // Table configuration
  const columns = [
    { key: "name", label: "Village Name" },
    { key: "img", label: "Image" },
    { key: "description", label: "Description" },
    { key: "numberOfUnits", label: "Number of Units" },
    { key: "zone", label: "Zone" },
    { key: "map", label: "Location" },
    { key: "population", label: "Population" },
    { key: "status", label: "Status" },
  ];

  const filterOptions = [
    {
      key: "searchableZone",
      label: "Zone",
      options: [
        { value: "all", label: "All Zones" },
        ...zones.map((zone) => ({ value: zone.name, label: zone.name })),
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
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <DataTable
        data={villages}
        columns={columns}
        showAddButton={hasPermission("VillagesAdd")}
        addRoute="/Villages/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={hasPermission("VillagesEdit")}
        showDeleteButton={hasPermission("VillagesDelete")}
        showActions={
          hasPermission("VillagesEdit") || hasPermission("VillagesDelete")
        }
        showFilter={true}
        filterOptions={filterOptions}
        searchKeys={["searchableName", "description"]}
        className="table-compact"
        onFilterChange={handleFilterChange}
      />
      
      {isInvoiceOpen && (
        <InvoiceDialog
          open={isInvoiceOpen}
          onOpenChange={setIsInvoiceOpen}
          villageId={invoiceVillageId}
        />
      )}
      
      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={handleCloseEdit}
            onSave={handleSave}
            selectedRow={selectedRow}
            zones={zones}
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* الحقول الإنجليزية */}
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Village Name (English)
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

              {/* الحقول العربية - بس لو الـ village أصلاً له ترجمة عربية */}
              {(selectedRow?.nameAr !== null && selectedRow?.nameAr !== undefined) && (
                <>
                  <label htmlFor="nameAr" className="text-gray-400 !pb-3">
                    اسم القرية (عربي)
                  </label>
                  <Input
                    id="nameAr"
                    value={selectedRow?.nameAr || ""}
                    onChange={(e) => onChange("nameAr", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                    dir="rtl"
                    placeholder="اسم القرية بالعربي"
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
                    placeholder="وصف القرية بالعربي"
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
                <SelectTrigger
                  id="zone"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {zones.length > 0 ? (
                    zones.map((zone) => (
                      <SelectItem
                        key={zone.id}
                        value={zone.id.toString()}
                        className="text-bg-primary"
                      >
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
              
              <label htmlFor="location" className="text-bg-primary !pb-3">
                Location
              </label>
              <MapLocationPicker
                key={selectedRow?.id}
                value={editLocationData.location_map}
                onChange={(newValue, coordinates) => {
                  setEditLocationData(prev => ({
                    ...prev,
                    location_map: newValue,
                    lat: coordinates?.lat || prev.lat,
                    lng: coordinates?.lng || prev.lng,
                  }));
                }}
                initialCoordinates={{
                  lat: editLocationData.lat,
                  lng: editLocationData.lng,
                }}
                placeholder="Search or select location on map"
              />

              {/* <label htmlFor="numberOfUnits" className="text-gray-400 !pb-3">
                Number of Units
              </label>
              <Input
                id="numberOfUnits"
                type="number"
                min="0"
                value={selectedRow?.numberOfUnits || ""}
                onChange={(e) => onChange("numberOfUnits", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              /> */}

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
                  {selectedRow.hasNewImage && (
                    <span className="text-sm text-green-600">New image selected</span>
                  )}
                </div>
              )}
              <Input
                type="file"
                id="image"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="!my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[5px]"
                onChange={handleImageChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.rawName || selectedRow.nameEn}
          />
        </>
      )}
    </div>
  );
};

export default Villages;