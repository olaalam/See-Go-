"use client";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout"; // Assuming this is your generic DataTable component
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
import InvoiceDialog from "@/components/InvoiceDialog"; // تأكدي من المسار
import MapLocationPicker from "@/components/MapLocationPicker"; // تأكدي من المسار

const Villages = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [villages, setVillages] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDelete] = useState(false); // Renamed to avoid conflict
  const token = localStorage.getItem("token");
  const [imageErrors, setImageErrors] = useState({});
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceVillageId, setInvoiceVillageId] = useState(null);
  const [permissions, setPermissions] = useState([]); // State for permissions

  // Removed initialPageToSet and totalPages calculation here,
  // as DataTableLayout now handles currentPage internally.
  // The DataTable will default to page 1 unless specific logic is added to it
  // to start on the last page.

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // الحصول على الصلاحيات من localStorage
  const getUserPermissions = () => {
    try {
      const permissions = localStorage.getItem("userPermission");
      const parsed = permissions ? JSON.parse(permissions) : [];

      const flatPermissions = parsed.map(
        (perm) => `${perm.module}:${perm.action}`
      );
      console.log("Flattened permissions for Villages:", flatPermissions); // لتتبع الصلاحيات
      return flatPermissions;
    } catch (error) {
      console.error("Error parsing user permissions:", error);
      return [];
    }
  };

  // التحقق من وجود صلاحية معينة - تم تعديلها للتعامل مع "Village" module
  const hasPermission = (permission) => {
    // تتوقع permission strings مثل "VillagesAdd", "VillagesEdit", "VillagesDelete", "VillagesStatus"
    const match = permission.match(/^Villages(.*)$/i);
    if (!match) return false; // إذا لم تبدأ الكلمة بـ "Villages"

    const permKey = match[1].toLowerCase(); // مثلاً "add", "edit", "delete", "status"
    const fullPerm = `Village:${permKey}`; // لتطابق "Village:add", "Village:edit" وهكذا

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fetchZones = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/zone", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const currentLang = localStorage.getItem("lang") || "en";
      const formattedZones = result.zones.map((zone) => {
        const translations = zone.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: zone.id,
          name: translations[currentLang]?.name || zone.name,
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
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = result?.villages.map((village) => {
        const translations = village.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || village.name || "—";
        const rawName = name; // Keep rawName for editing purposes

        const nameClickable = (
          <span
            onClick={() => navigate(`/villages/single-page-v/${village.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer"
          >
            {name}
          </span>
        );

        const description =
          translations[currentLang]?.description || village.description || "—";
        const zoneName =
          village.zone?.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value ||
          village.zone?.name ||
          "—";

        const image =
          village?.image_link && !imageErrors[village.id] ? (
            <img
              src={village?.image_link}
              alt={name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(village.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        const map = village.location || "—";
        const population = village.population_count || "—";

        return {
          id: village.id,
          name: nameClickable, // JSX for display
          rawName, // Plain text for editing
          searchableName: name, // تأكد إن دي موجودة دايماً وهي string
          description,
          img: image,
          // Ensure numberOfUnits is a number or can be converted to one for the input type="number"
          numberOfUnits: village.units_count ?? 0, // Default to 0 instead of "0" for number type
          status: village.status === 1 ? "active" : "inactive",
          zone_id: village.zone_id,
          zone: zoneName,
          searchableZone: zoneName, // للفلتر
          map,
          population,
          image_link: village.image_link,
        };
      });
      setVillages(formatted);
    } catch (error) {
      console.error("Error fetching villages:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchVillages(), fetchZones()]);
    };
    fetchData();
  }, []);

  const handleEdit = (village) => {
    // Ensure that numberOfUnits is passed as a number for the input type="number"
    const editableVillage = {
      ...village,
      name: village.rawName, // Use the raw name for the input field
      numberOfUnits: Number(village.numberOfUnits), // Convert to number explicitly
    };
    setSelectedRow(editableVillage);
    setIsEditOpen(true);
  };

  const handleDelete = (village) => {
    setSelectedRow(village);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    // طبقة حماية إضافية: التحقق من الصلاحية قبل محاولة الحفظ
    if (!hasPermission("VillagesEdit")) {
      toast.error("You don't have permission to edit villages");
      return;
    }

    const { id, name, description, status, zone_id, map, numberOfUnits } =
      selectedRow;

    if (!zone_id || isNaN(zone_id)) {
      toast.error("Zone ID is missing or invalid");
      return;
    }
    // Ensure numberOfUnits is a valid number before sending
    const parsedNumberOfUnits = parseInt(numberOfUnits, 10);
    if (isNaN(parsedNumberOfUnits)) {
      toast.error("Number of Units is invalid.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("status", status === "active" ? "1" : "0");
    formData.append("zone_id", zone_id.toString());
    formData.append("location", map);
    formData.append("units_count", parsedNumberOfUnits); // Use parsed value

    if (selectedRow.imageFile) {
      formData.append("image", selectedRow.imageFile);
    } else if (selectedRow.image_link) {
      // If there's an existing image link but no new file, send the link back
      formData.append("image", selectedRow.image_link);
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/update/${id}`,
        {
          method: "POST", // Note: Usually PUT for updates, but your backend uses POST
          headers: {
            Authorization: `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' is NOT needed with FormData, browser sets it.
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Village updated successfully!");
        await fetchVillages(); // Re-fetch to update table with new data
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errText = await response.text();
        console.error("Failed to update:", errText);
        toast.error("Failed to update village!");
      }
    } catch (error) {
      console.error("Error occurred while updating village!", error);
      toast.error("Error occurred while updating village!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    // طبقة حماية إضافية: التحقق من الصلاحية قبل محاولة الحذف
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
        setVillages(
          villages.filter((village) => village.id !== selectedRow.id)
        );
        setIsDeleteOpen(false); // Correct state setter
        setSelectedRow(null);
      } else {
        toast.error("Failed to delete village!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting village!", error);
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      // Convert to number for 'zone_id' and 'numberOfUnits' keys
      [key]:
        key === "zone_id" || key === "numberOfUnits"
          ? parseInt(value, 10)
          : value,
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

  const handleToggleStatus = async (row, newStatus) => {
    // طبقة حماية إضافية: التحقق من الصلاحية قبل محاولة تغيير الحالة
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
        setVillages((prevVillages) =>
          prevVillages.map((village) =>
            village.id === id
              ? { ...village, status: newStatus === 1 ? "active" : "inactive" }
              : village
          )
        );
      } else {
        toast.error("Failed to update village status!");
      }
    } catch (error) {
      toast.error("Error occurred while updating village status!", error);
    }
  };

  const columns = [
    { key: "name", label: "Village Name" },
    { key: "img", label: "Image" },
    { key: "description", label: "Description" },
    { key: "numberOfUnits", label: "Number of Units" }, // Keep this here for display
    { key: "zone", label: "Zone" }, // Changed key to 'zone' for consistency
    { key: "map", label: "Location" },
    { key: "population", label: "Population" },
    { key: "status", label: "Status" }, // Status column to render the switch
  ];

  // Prepare filter options for zone and status in the grouped format expected by DataTable
  const filterOptionsForVillages = [
    {
      key: "searchableZone",
      label: "Filter by Zone",
      options: [
        { value: "all", label: "All Zones" },
        ...zones.map((zone) => ({ value: zone.name, label: zone.name })),
      ],
    },
    {
      key: "status",
      label: "Filter by Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  // Debugging permissions (يمكنك إزالة هذه الأسطر في الإنتاج)
  console.log("Has VillagesAdd permission:", hasPermission("VillagesAdd"));
  console.log("Has VillagesEdit permission:", hasPermission("VillagesEdit"));
  console.log(
    "Has VillagesDelete permission:",
    hasPermission("VillagesDelete")
  );
  console.log(
    "Has VillagesStatus permission:",
    hasPermission("VillagesStatus")
  );

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={villages}
        columns={columns}
        showAddButton={hasPermission("VillagesAdd")}
        addRoute="/Villages/add"
        // Removed initialPage prop. Let DataTableLayout manage its own page state (defaults to 1).
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={hasPermission("VillagesEdit")}
        showDeleteButton={hasPermission("VillagesDelete")}
        showActions={
          hasPermission("VillagesEdit") || hasPermission("VillagesDelete")
        }
        showFilter={true}
        filterOptions={filterOptionsForVillages}
        searchKeys={["searchableName", "description"]}
        className="table-compact"
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
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            zones={zones}
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Village Name
              </label>
              <Input
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="description" className="text-gray-400 !pb-3">
                Description
              </label>
              <Input
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="zone" className="text-gray-400 !pb-3">
                Zone
              </label>
              <Select
                value={selectedRow?.zone_id?.toString()}
                onValueChange={(value) => onChange("zone_id", value)}
              >
                <SelectTrigger
                  id="zone"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {zones.map((zone) => (
                    <SelectItem
                      key={zone.id}
                      value={zone.id.toString()}
                      className="text-bg-primary"
                    >
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label htmlFor="location" className="text-bg-primary !pb-3">
                Location
              </label>
              <MapLocationPicker
                value={selectedRow?.map || ""}
                onChange={(newValue) => onChange("map", newValue)}
                placeholder="Search or select location on map"
              />

              {/* Uncommented: Number of Units field in EditDialog */}
              <label htmlFor="numberOfUnits" className="text-gray-400 !pb-3">
                Number of Units
              </label>
              <Input
                id="numberOfUnits"
                type="number" // Ensure type is number
                value={selectedRow?.numberOfUnits || ""} // Use 0 or empty string as default
                onChange={(e) => onChange("numberOfUnits", e.target.value)}
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
            onOpenChange={setIsDeleteOpen} // Corrected this to setIsDeleteOpen
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
          />
        </>
      )}
    </div>
  );
};

export default Villages;