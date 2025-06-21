"use client";

import { useEffect, useState, useMemo } from "react"; // Import useMemo

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
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [malls, setMalls] = useState([]); // Renamed for clarity
  const [allMalls, setAllMalls] = useState([]); // Store original fetched data

  const [zones, setZones] = useState([]); // Will be populated from result.zones

  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [permissions, setPermissions] = useState([]); // State for permissions

  // New state for filter selections
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
    const match = permission.match(/^Mall(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Mall:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);



  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fetchMalls = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/mall", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      // Populate Zones state from result.zones (if available in your actual API response)
      // Assuming 'result.zones' contains all zones, not just the ones associated with malls
      const formattedZones = (result.zones || []).map((zone) => {
        const name =
          zone.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || zone.name;
        return { id: zone.id, name: name };
      });
      setZones(formattedZones);

      // Process malls array
      const formattedMalls = (result.malls || []).map((mall) => {
        const translations =
          mall.translations?.reduce((acc, t) => {
            if (!acc[t.locale]) acc[t.locale] = {};
            acc[t.locale][t.key] = t.value;
            return acc;
          }, {}) || {};

        const name = translations[currentLang]?.name || mall.name || "—";
        const rawName = name; // For use in input fields

        const nameClickable = (
          <span
            onClick={() => navigate(`/mall/single-page-m/${mall.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer "
          >
            {name}
          </span>
        );
        // Assuming location is directly available or derived, if not, it will be "—"
        const location =
          translations[currentLang]?.location || mall.location || "—";
        const description =
          translations[currentLang]?.description || mall.description || "—";

        const image =
          mall?.image_link && !imageErrors[mall.id] ? (
            <img
              src={mall.image_link}
              alt={mall.name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(mall.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        // Access phone and rating directly from mall object if they exist in your full data
        const phone = mall.phone || "—"; // Your sample data doesn't have phone
        const rating = mall.rate || "—"; // Your sample data doesn't have rate

        // Extract zone information directly from the nested zone object
        let zoneName = "—";
        let zone_id = null;
        if (mall.zone) {
          const zoneTranslation = mall.zone.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          );
          zoneName = zoneTranslation?.value || mall.zone.name || "—";
          zone_id = mall.zone.id;
        }

        return {
          id: mall.id,
          name: nameClickable,
          rawName,
          location, // Use 'location' to align with selectedRow structure
          description,
          img: image,
          status: mall.status === 1 ? "Active" : "Inactive",
          image_link: mall.image_link,
          zoneName,
          zone_id,
          phone,
          rating,
          open_from: mall.open_from,
          open_to: mall.open_to,
        };
      });

      setAllMalls(formattedMalls); // Store the full list
      setMalls(formattedMalls); // Initialize displayed malls
    } catch (error) {
      console.error("Error fetching malls:", error);
      toast.error("An error occurred while fetching data!");
    } finally {
      dispatch(hideLoader());
    }
  };

  // Fetch provider data on component mount
  useEffect(() => {
    fetchMalls();
  }, []);

  // Filtering logic using useMemo to optimize performance
  const filteredMalls = useMemo(() => {
    let currentFilteredMalls = [...allMalls];

    if (selectedZoneFilter !== "all") {
      currentFilteredMalls = currentFilteredMalls.filter(
        (mall) => mall.zoneName === selectedZoneFilter
      );
    }

    if (selectedStatusFilter !== "all") {
      currentFilteredMalls = currentFilteredMalls.filter(
        (mall) =>
          mall.status.toLowerCase() === selectedStatusFilter.toLowerCase()
      );
    }

    return currentFilteredMalls;
  }, [allMalls, selectedZoneFilter, selectedStatusFilter]);

  useEffect(() => {
    // Update displayed malls whenever filters change
    setMalls(filteredMalls);
  }, [filteredMalls]);

  const handleEdit = async (mall) => {
    setselectedRow({
      ...mall,
      name: mall.rawName, // Use rawName here for the text field
      open_from: mall.open_from || "",
      open_to: mall.open_to || "",
      zone_id: mall.zone_id, // Ensure zone_id is passed
      location: mall.location || "", // Pass location from the mall object
    });
    setIsEditOpen(true);
  };

  const handleDelete = (mall) => {
    setselectedRow(mall);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    if (isEditOpen && selectedRow) {
      console.log("selectedRow data when opening Edit Dialog:", selectedRow);
    }
  }, [isEditOpen, selectedRow]);

  const handleSave = async () => {
    const {
      id,
      name, // This is now rawName
      description,
      status,
      zone_id, // Must be available

      open_from,
      open_to,
      //location, // Get location from selectedRow
    } = selectedRow;

    if (!zone_id || isNaN(parseInt(zone_id, 10))) {
      toast.error("Zone ID is missing or invalid");
      return;
    }
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("MallEdit")) {
      toast.error("You don't have permission to edit Mall");
      return;
    }
    const updatedMall = new FormData();
    updatedMall.append("id", id);
    updatedMall.append("name", name || "");
   // updatedMall.append("location", location || "");
    updatedMall.append("description", description || "");
    updatedMall.append("status", status === "Active" ? "1" : "0");
    updatedMall.append("zone_id", parseInt(zone_id, 10));

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
    };

    updatedMall.append("open_from", formatTimeWithSeconds(open_from));
    updatedMall.append("open_to", formatTimeWithSeconds(open_to));

// ... (inside handleSave function)

 if (selectedRow.imageFile) {
 // If a new image file is selected, append it
 updatedMall.append("image", selectedRow.imageFile);
 } else if (selectedRow.image_link) {
 // If no new image file is selected, but there's an existing image_link,
 // append the existing image link. Your backend should be set up to handle this
 // (i.e., if the 'image' field contains a URL, it means to keep the old one).
 updatedMall.append("image", selectedRow.image_link);
 }

// ... (rest of your handleSave function)

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/mall/update/${id}`,
        {
          method: "POST", // Often PUT for updates, but your code uses POST with ID in URL
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updatedMall,
        }
      );

      if (response.ok) {
        toast.success("Mall updated successfully!");
       await fetchMalls(); // Re-fetch malls to update the table
        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update mall!");
      }
    } catch (error) {
      console.error("Error updating mall:", error);
      toast.error("Error occurred while updating mall!");
    }
  };

  const handleDeleteConfirm = async () => {
        // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("MallDelete")) {
      toast.error("You don't have permission to delete Mall");
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
        setMalls(malls.filter((mall) => mall.id !== selectedRow.id));
        setIsDeleteOpen(false);
        // After deletion, re-apply filters to the remaining allMalls
        setAllMalls(allMalls.filter((mall) => mall.id !== selectedRow.id));
      } else {
        toast.error("Failed to delete mall!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting mall!", error);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => {
      let newValue = value;
      // Convert values to integers if they are zone_id
      if (key === "zone_id") {
        newValue = parseInt(value, 10);
      }

      return {
        ...prev,
        [key]: newValue,
        // Ensure rawName is updated only when the key is 'name'
        rawName: key === "name" ? value : prev.rawName,
      };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setselectedRow((prev) => ({
        ...prev,
        imageFile: file,
        image_link: URL.createObjectURL(file), // For immediate preview of the new image
      }));
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
        // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("MallStatus")) {
      toast.error(
        "You don't have permission to change Mall status"
      );
      return;
    }
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
        // Update allMalls and let useMemo re-calculate filteredMalls
        setAllMalls((prevAllMalls) =>
          prevAllMalls.map((mall) =>
            mall.id === id
              ? { ...mall, status: newStatus === 1 ? "Active" : "Inactive" }
              : mall
          )
        );
      } else {
        toast.error("Failed to update mall status!");
      }
    } catch (error) {
      toast.error("Error occurred while updating mall status!", error);
    }
  };

  const columns = [
    { key: "name", label: "Mall" },
    { key: "img", label: "Image" },
    { key: "description", label: "Description" },
    { key: "zoneName", label: "Zone" },

    { key: "status", label: "Status" },
  ];

  const filterOptionsForVillages = [
    {
      key: "zoneName", // Changed to match the data key
      label: "Zone",
      options: [
        { value: "all", label: "All Zones" },
        ...zones.map((zone) => ({ value: zone.name, label: zone.name })),
      ],
    },
    {
      key: "status", // Matches the data key
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
        data={malls} // Pass the filtered data here
        columns={columns}
                showAddButton={hasPermission("MallAdd")}

        addRoute="/mall/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={[
          "name",
          "location",
          "zoneName",
        ]}
        showEditButton={hasPermission("MallEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
        showDeleteButton={hasPermission("MallDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
        showActions={hasPermission("MallEdit") || hasPermission("MallDelete")}
        showFilter={true}
        filterOptions={filterOptionsForVillages} // Pass the enhanced filterOptions
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            zones={zones} // Pass the extracted zones
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Mall Name
              </label>
              <Input
                label="Mall Name"
                id="name"
                value={selectedRow?.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
{/*
              <label htmlFor="location" className="text-gray-400 !pb-3">
                Location
              </label>
              <MapLocationPicker
                value={selectedRow?.location || ""}
                onChange={(newValue) => onChange("location", newValue)}
                placeholder="Search or select location on map"
              />*/}

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
                        className="text-bg-primary "
                      >
                        {zone.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem
                      value={null}
                      className="text-bg-primary"
                      disabled
                    >
                      No zones available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <label htmlFor="description" className="text-gray-400 !pb-3">
                Description
              </label>
              <Input
                label="description"
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
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
            name={selectedRow.name}
          />
        </>
      )}
    </div>
  );
};
export default Mall;