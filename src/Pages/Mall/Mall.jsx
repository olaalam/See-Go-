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

const Mall = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoading = useSelector((state) => state.loader.isLoading);

  // Core data states
  const [malls, setMalls] = useState([]);
  const [allMalls, setAllMalls] = useState([]);
  const [zones, setZones] = useState([]);
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
    const match = permission.match(/^Mall(.*)$/i);
    if (!match) return false;
    const permKey = match[1].toLowerCase();
    const fullPerm = `Mall:${permKey}`;
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
      const currentLang = localStorage.getItem("lang") || "en";
      
      if (result.zones && Array.isArray(result.zones)) {
        const formattedZones = result.zones.map((zone) => {
        const translations = zone.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
          }, {}) || {};
          return {
            id: zone.id,
            name: translations[currentLang]?.name || zone.name,
          };
        });
        setZones(formattedZones);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchMalls = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/mall", {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      if (!result || !result.malls || !Array.isArray(result.malls)) {
        console.error("Invalid API response structure:", result);
        setAllMalls([]);
        setMalls([]);
        return;
      }

      const formatted = result.malls.map((mall) => {
        // فصل الترجمات حسب اللغة والنوع - same as zones
        const translations = mall.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

 // استخراج البيانات بالإنجليزي (للعرض في الجدول)
        const nameEn = translations?.en?.name || mall.name || "—";
        const descriptionEn = translations?.en?.description || mall.description || "—";

        // استخراج البيانات بالعربي (للـ EditDialog) 
        // هنا هنتأكد إن الترجمة العربية موجودة فعلاً
        const nameAr = translations?.ar?.name || null;
        const descriptionAr = translations?.ar?.description || null;

        // Raw name for editing
        const rawName = nameEn;

        const nameClickable = (
          <span
            onClick={() => navigate(`/mall/single-page-m/${mall.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer"
          >
            {name}
          </span>
        );

        const location = translations[currentLang]?.location || mall.location || "—";
        
        // Get zone information
        const zoneObj = zones.find(z => z.id === mall.zone_id);
        const zoneName = zoneObj?.name || 
          mall.zone?.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value ||
          mall.zone?.name ||
          "—";

        const image = mall?.image_link && !imageErrors[mall.id] ? (
          <img
            src={mall.image_link}
            alt={name}
            className="w-12 h-12 rounded-md object-cover aspect-square"
            onError={() => handleImageError(mall.id)}
          />
        ) : (
          <Avatar className="w-12 h-12">
            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
          </Avatar>
        );

        const phone = mall.phone || "—";
        const rating = mall.rate || "—";

        return {
          id: mall.id,
          name: nameClickable,
          rawName,
          nameEn: nameEn,
          description: descriptionEn,
          // إضافة الحقول العربية (null لو مش موجودة)
          nameAr: nameAr,
          descriptionAr: descriptionAr,
          searchableName: name,
          img: image,
          status: mall.status === 1 ? "active" : "inactive",
          zone_id: mall.zone_id,
          zone: zoneName,
          searchableZone: zoneName,
          location,
          phone,
          rating,
          image_link: mall.image_link,
          open_from: mall.open_from || "",
          open_to: mall.open_to || "",
          location_map: mall.location_map || "",
          lat: mall.lat || 31.2001,
          lng: mall.lng || 29.9187,
        };
      });
      
      setAllMalls(formatted);
      setMalls(formatted);
    } catch (error) {
      console.error("Error fetching malls:", error);
      toast.error("Failed to fetch malls data");
      setAllMalls([]);
      setMalls([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  // Filter malls using useMemo
  const filteredMalls = useMemo(() => {
    let filtered = [...allMalls];

    if (filters.zone !== "all") {
      filtered = filtered.filter(mall => mall.searchableZone === filters.zone);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(mall => mall.status === filters.status);
    }

    return filtered;
  }, [allMalls, filters]);

  // Dialog handlers
  const handleEdit = (mall) => {
    if (!mall) {
      console.error("No mall data provided for editing");
      return;
    }
    
    const editableMall = {
      ...mall,
      name: mall.rawName || mall.name,
    };
    
    setSelectedRow(editableMall);
    
    // Set location data
    const locationData = {
      location_map: mall.location_map || mall.location || "",
      lat: mall.lat || 31.2001,
      lng: mall.lng || 29.9187,
    };
    
    console.log("Setting location data:", locationData);
    setEditLocationData(locationData);
    
    setIsEditOpen(true);
  };

  // Sync location data when selectedRow changes
  useEffect(() => {
    if (selectedRow && isEditOpen) {
      const locationData = {
        location_map: selectedRow.location_map || selectedRow.location || "",
        lat: selectedRow.lat || 31.2001,
        lng: selectedRow.lng || 29.9187,
      };
      
      console.log("Syncing location data from selectedRow:", locationData);
      setEditLocationData(locationData);
    }
  }, [selectedRow, isEditOpen]);

  const handleDelete = (mall) => {
    if (!mall) {
      console.error("No mall data provided for deletion");
      return;
    }
    
    setSelectedRow(mall);
    setIsDeleteOpen(true);
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: key === "zone_id" ? parseInt(value, 10) || 0 : value,
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

  const formatTimeWithSeconds = (time) => {
    if (!time) return "";
    return time.length === 5 ? `${time}:00` : time;
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    if (!hasPermission("MallEdit")) {
      toast.error("You don't have permission to edit malls");
      return;
    }

    const { id, name, description,nameAr, descriptionAr,status, zone_id, open_from, open_to, newImageBase64, hasNewImage } = selectedRow;

    // Validation
    if (!id) {
      toast.error("Mall ID is missing");
      return;
    }

    if (!zone_id || isNaN(zone_id)) {
      toast.error("Zone ID is missing or invalid");
      return;
    }

    if (!name || name.trim() === "") {
      toast.error("Mall name is required");
      return;
    }

    const updatedMall = {
      id,
      name: name.trim(),
      description: description || "",
      status: status === "active" ? "1" : "0",
      zone_id: parseInt(zone_id, 10),
      location: editLocationData.location_map,
      open_from: formatTimeWithSeconds(open_from) || "",
      open_to: formatTimeWithSeconds(open_to) || "",
      lat: editLocationData.lat.toString(),
      lng: editLocationData.lng.toString(),
      location_map: editLocationData.location_map,
    };
    // إضافة الحقول العربية بس لو موجودة أصلاً في الداتا - same logic as zones
    if (selectedRow.nameAr !== null && selectedRow.nameAr !== undefined) {
      updatedMall.ar_name = nameAr || "";
    }
    if (selectedRow.descriptionAr !== null && selectedRow.descriptionAr !== undefined) {
      updatedMall.ar_description = descriptionAr || "";
    }

    if (hasNewImage && newImageBase64) {
      console.log("Adding new image to update data, base64 length:", newImageBase64.length);
      updatedMall.image = selectedRow.imageBase64;
    }

    console.log("Sending update data:", {
      ...updatedMall,
      image: updatedMall.image ? `[base64 data: ${updatedMall.image.length} chars]` : 'no image'
    });

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/mall/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedMall),
        }
      );

      const responseData = await response.json();
      
      if (response.ok) {
        toast.success("Mall updated successfully!");
        await fetchMalls();
        setIsEditOpen(false);
        setSelectedRow(null);
        setEditLocationData({ location_map: "", lat: 31.2001, lng: 29.9187 });
      } else {
        console.error("Update failed:", responseData);
        
        if (responseData.errors && responseData.errors.image) {
          toast.error("Image validation failed: " + responseData.errors.image.join(", "));
        } else {
          toast.error(responseData.message || "Failed to update mall!");
        }
      }
    } catch (error) {
      console.error("Error occurred while updating mall:", error);
      toast.error("Network error occurred while updating mall!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    if (!hasPermission("MallDelete")) {
      toast.error("You don't have permission to delete malls");
      return;
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/mall/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Mall deleted successfully!");
        setAllMalls(prev => prev.filter(mall => mall.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to delete mall!");
      }
    } catch (error) {
      console.error("Error occurred while deleting mall!", error);
      toast.error("Error occurred while deleting mall!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    if (!row || !row.id) {
      console.error("Invalid row data for status toggle");
      toast.error("Invalid mall data");
      return;
    }

    if (!hasPermission("MallStatus")) {
      toast.error("You don't have permission to change mall status");
      return;
    }

    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/mall/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Mall status updated successfully!");
        setAllMalls(prev =>
          prev.map(mall =>
            mall.id === id
              ? { ...mall, status: newStatus === 1 ? "active" : "inactive" }
              : mall
          )
        );
      } else {
        toast.error("Failed to update mall status!");
      }
    } catch (error) {
      console.error("Error occurred while updating mall status!", error);
      toast.error("Error occurred while updating mall status!");
    }
  };

  // Effects
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchMalls(), fetchZones()]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setMalls(filteredMalls);
  }, [filteredMalls]);

  // Table configuration
  const columns = [
    { key: "name", label: "Mall" },
    { key: "img", label: "Image" },
    { key: "description", label: "Description" },
    { key: "zone", label: "Zone" },
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
        data={malls}
        columns={columns}
        showAddButton={hasPermission("MallAdd")}
        addRoute="/mall/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={hasPermission("MallEdit")}
        showDeleteButton={hasPermission("MallDelete")}
        showActions={
          hasPermission("MallEdit") || hasPermission("MallDelete")
        }
        showFilter={true}
        filterOptions={filterOptions}
        searchKeys={["searchableName", "description", "location"]}
        className="table-compact"
        onFilterChange={handleFilterChange}
      />
      
      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            zones={zones}
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* الحقول الإنجليزية */}
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Mall Name (English)
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
              
              {/* <label htmlFor="location" className="text-bg-primary !pb-3">
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
              /> */}

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
            name={selectedRow.rawName || selectedRow.name}
          />
        </>
      )}
    </div>
  );
};

export default Mall;