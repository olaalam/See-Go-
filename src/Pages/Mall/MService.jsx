"use client"; 
import { useEffect, useState, useMemo } from "react";
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
import { useParams } from "react-router-dom";
import MapLocationPicker from "@/components/MapLocationPicker";

const Providers = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]); // Store original fetched data

  // هذه الحالات سنستخدمها لتخزين **الخيارات الفريدة** للفلاتر
  // وسنستخدمها أيضاً لتعبئة قوائم الاختيار في EditDialog
  const [availableProvider, setAvailableProvider] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]); // Packages (which are villages in your context)
  const [availableServices, setAvailableServices] = useState([]);
  const [permissions, setPermissions] = useState([]); // State for permissions

  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const { id } = useParams(); // mall_id from URL

  // New state for filter selections
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("all");
  const [selectedVillageFilter, setSelectedVillageFilter] = useState("all"); // Renamed to village for clarity in filter
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("all");

  const token = localStorage.getItem("token");
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
    const match = permission.match(/^Provider(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Provider:${permKey}`;

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

  const fetchProviders = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/mall/providers?mall_id=${id}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      // 1. Process providers array
      const fetchedProviders = (result.provider || []).map((provider) => {
        const translations =
          provider.translations?.reduce((acc, t) => {
            if (!acc[t.locale]) acc[t.locale] = {};
            acc[t.locale][t.key] = t.value;
            return acc;
          }, {}) || {};

        const name = translations[currentLang]?.name || provider.name || "—";
        const map =
          translations[currentLang]?.location || provider.location || "—";
        const description =
          translations[currentLang]?.description || provider.description || "—";

        const rawImageLink = provider?.image_link;
        let imageUrl = rawImageLink;
        // Fix for double base URL issue
        if (
          rawImageLink &&
          rawImageLink.startsWith(
            "https://bcknd.sea-go.org/storage/https://bcknd.sea-go.org/storage/"
          )
        ) {
          imageUrl = rawImageLink.replace(
            "https://bcknd.sea-go.org/storage/",
            ""
          );
        } else if (rawImageLink && !rawImageLink.startsWith("http")) {
          imageUrl = `https://bcknd.sea-go.org/storage/${rawImageLink}`;
        }

        const image =
          imageUrl && !imageErrors[provider.id] ? (
            <img
              src={imageUrl}
              alt={provider.name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(provider.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0) || "P"}</AvatarFallback>
            </Avatar>
          );

        const phone = provider.phone || "—";
        const rating = provider.rate || "—";

        // استخراج الأسماء والمعرفات مباشرة من الكائنات المتداخلة
        const service_id = provider.service?.id || null;
        const serviceName = provider.service?.name || "—";

        // الـ API تعطي `package_id` و `village_id`، ونحن نستخدم `package` ككائن قرية
        const package_obj_id = provider.package?.id || null;
        const villageName = provider.package?.name || "—"; // This is the package name

        const zone_id = provider.zone?.id || null; // تأكد من الحصول على zone_id من الكائن zone
        const zoneName = provider.zone?.name || "—";
        const adminName = provider.super_admin?.name || "—";

        return {
          id: provider.id,
          name,
          rawName: provider.name, // Store original name for editing
          map,
          description,
          img: image,
          numberOfproviders: provider.providers_count ?? "0",
          status: provider.status === 1 ? "Active" : "Inactive",
          service_id,
          phone,
          rating,
          image_link: imageUrl,
          package_id: package_obj_id, // استخدام package_obj_id كـ package_id
          village_id: provider.village_id, // هذا village_id من البيانات الأصلية للمزود (إذا كان موجوداً ومختلفاً عن package_id)
          zone_id,
          open_from: provider.open_from,
          open_to: provider.open_to,
          zoneName,
          adminName,
          villageName, // This is the package name
          serviceName,
        };
      });

      setAllProviders(fetchedProviders); // Store the full list
      setProviders(fetchedProviders); // Initialize displayed providers

      // 2. Collect unique zones, packages, and services for filter options and EditDialog
           if (result.zones) {
        setAvailableProvider(result.zones.map(zone => ({
          id: zone.id.toString(),
          name: zone.name
        })));
      }
            if (result.service_type) {
        setAvailableServices(result.service_type.map(service => ({
          id: service.id.toString(),
          name: service.name
        })));
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Error fetching providers:", error.message || "Unknown error");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [id]); // Depend on id from useParams to refetch if mall changes

  const filteredProviders = useMemo(() => {
    let currentFilteredProviders = [...allProviders];

    if (selectedZoneFilter !== "all") {
      currentFilteredProviders = currentFilteredProviders.filter(
        (provider) => provider.zoneName === selectedZoneFilter
      );
    }

    if (selectedVillageFilter !== "all") {
      currentFilteredProviders = currentFilteredProviders.filter(
        (provider) => provider.villageName === selectedVillageFilter
      );
    }

    if (selectedServiceFilter !== "all") {
      currentFilteredProviders = currentFilteredProviders.filter(
        (provider) => provider.serviceName === selectedServiceFilter
      );
    }



    return currentFilteredProviders;
  }, [
    allProviders,
    selectedZoneFilter,
    selectedVillageFilter,
    selectedServiceFilter,

  ]);

  useEffect(() => {
    setProviders(filteredProviders);
  }, [filteredProviders]);

const handleEdit = async (provider) => {
  // Note: 'package_id' from fetched data is used as 'village_id' in selectedRow for the EditDialog's 'Package' field
  setselectedRow({
    ...provider,
    service_id: provider.service_id ?? "",
    name: provider.rawName, // Use rawName for editing
    open_from: provider.open_from || "", // Corrected
    open_to: provider.open_to || "", // Corrected
    zone_id: provider.zone_id,
  });
  setIsEditOpen(true);
};

  const handleDelete = (provider) => {
    setselectedRow(provider);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    // Validate required fields before sending
    if (!selectedRow) return;
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("ProviderEdit")) {
      toast.error("You don't have permission to edit zones");
      return;
    }
    const {
      id,
      name,
      description,
      status,
      service_id,
      zone_id,
      phone,
      open_from,
      open_to,
      map: location,
    } = selectedRow;

    // Basic validation
    if (!name || name.trim() === "") {
      toast.error("Provider Name is required.");
      return;
    }
    if (!service_id) {
      toast.error("Service is required.");
      return;
    }

    if (!zone_id) {
      toast.error("Zone is required.");
      return;
    }

    // Convert string IDs to integers
    const parsedServiceId = parseInt(service_id, 10);

    const parsedZoneId = parseInt(zone_id, 10);

    if (isNaN(parsedServiceId)) {
      toast.error("Invalid Service ID.");
      return;
    }

    if (isNaN(parsedZoneId)) {
      toast.error("Invalid Zone ID.");
      return;
    }

    const updatedProvider = new FormData();
    updatedProvider.append("id", id);
    updatedProvider.append("name", name.trim());
    updatedProvider.append("location", location || "");
    updatedProvider.append("description", description || "");
    updatedProvider.append("status", status === "Active" ? "1" : "0");
    updatedProvider.append("service_id", parsedServiceId);
    updatedProvider.append("phone", phone || "");
    updatedProvider.append("zone_id", parsedZoneId);

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      // Ensure time is in HH:MM:SS format
      return time.length === 5 ? `${time}:00` : time;
    };

    updatedProvider.append("open_from", formatTimeWithSeconds(open_from));
    updatedProvider.append("open_to", formatTimeWithSeconds(open_to));

    if (selectedRow.imageFile) {
      updatedProvider.append("image", selectedRow.imageFile);
    } else if (selectedRow.image_link) {
      // Send the existing image as a fallback
      updatedProvider.append("image", selectedRow.image_link);
    }



    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/update/${id}`,
        {
          method: "POST", // Use POST for FormData updates
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type" is not set for FormData, browser sets it automatically with boundary
          },
          body: updatedProvider,
        }
      );

      if (response.ok) {
        toast.success("Provider updated successfully!");
        await fetchProviders(); // Re-fetch to update the table
        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update provider!");
      }
    } catch (error) {
      console.error("Error updating provider:", error);
      toast.error("Error occurred while updating provider!");
    }
  };

  const handleDeleteConfirm = async () => {
        // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("ProviderDelete")) {
      toast.error("You don't have permission to delete zones");
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
        // Update both displayed and allProviders state
        setProviders(
          providers.filter((provider) => provider.id !== selectedRow.id)
        );
        setAllProviders(
          allProviders.filter((provider) => provider.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
        setselectedRow(null); // Clear selected row after deletion
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete provider!");
      }
    } catch (error) {
      console.error("Error occurred while deleting provider:", error);
      toast.error("Error occurred while deleting provider!");
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => {
      let newValue = value;
      // Convert to integer only if the key is an ID
      if (["service_id", "village_id", "zone_id"].includes(key)) {
        newValue = parseInt(value, 10);
      }

      const updatedRow = { ...prev, [key]: newValue };

      // إذا تغيرت القرية (Package)، نحدث المنطقة تلقائيًا لتتوافق مع المنطقة الخاصة بهذه القرية
      if (key === "village_id") {
        const selectedVillagePackage = availablePackages.find(
          (v) => v.id === parseInt(value, 10)
        );
        if (
          selectedVillagePackage &&
          selectedVillagePackage.zone_id !== prev.zone_id
        ) {
          updatedRow.zone_id = selectedVillagePackage.zone_id;
        }
      }

      // إذا تغيرت المنطقة، قد نحتاج لتحديث القرية (Package) إذا كانت القرية المختارة سابقاً لا تنتمي للمنطقة الجديدة
      // أو لجعلها فارغة لإجبار المستخدم على الاختيار من جديد
      if (key === "zone_id" && prev.village_id) {
        const currentSelectedVillagePackage = availablePackages.find(
          (p) => p.id === prev.village_id
        );
        if (
          currentSelectedVillagePackage &&
          currentSelectedVillagePackage.zone_id !== newValue
        ) {
          updatedRow.village_id = ""; // Clear village_id if it no longer matches the new zone
        }
      }

      return updatedRow;
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setselectedRow((prev) => ({
        ...prev,
        imageFile: file,
        image_link: URL.createObjectURL(file), // Show preview
      }));
    }
  };



  const columns = [
    { key: "name", label: "Provider " },
    { key: "img", label: "Image" },
    { key: "zoneName", label: "Zone" },
    { key: "serviceName", label: "Service " },
    {key:"adminName", label: "Admin Name"}, // Display as "Admin Name"
    { key: "villageName", label: "Package" }, // Display as "Package"
    { key: "phone", label: "Phone" },
    { key: "rating", label: "Rating" },

  ];

  const filterOptions = [
    {
      key: "zoneName",
      label: "Zone",
      options: [
        { value: "all", label: "All Provider" },
        ...availableProvider.map((zone) => ({ value: zone.name, label: zone.name })),
      ],
      onChange: (value) => setSelectedZoneFilter(value),
      selectedValue: selectedZoneFilter,
    },
    {
      key: "villageName",
      label: "Package", // Display as "Package" in filter options
      options: [
        { value: "all", label: "All Packages" },
        ...availablePackages
          .filter(
            (pkg) =>
              selectedZoneFilter === "all" ||
              pkg.zone_id ===
                availableProvider.find((z) => z.name === selectedZoneFilter)?.id
          )
          .map((v) => ({ value: v.name, label: v.name })),
      ],
      onChange: (value) => setSelectedVillageFilter(value),
      selectedValue: selectedVillageFilter,
    },
    {
      key: "serviceName",
      label: "Service",
      options: [
        { value: "all", label: "All Services" },
        ...availableServices.map((service) => ({
          value: service.name,
          label: service.name,
        })),
      ],
      onChange: (value) => setSelectedServiceFilter(value),
      selectedValue: selectedServiceFilter,
    },

  ];

  // Filtered packages for the Edit Dialog's 'Package' select
  // This will dynamically update based on the selectedZoneId in the dialog itself
  const filteredPackagesForEditDialog = useMemo(() => {
    if (!selectedRow?.zone_id) {
      return availablePackages; // Show all if no zone is selected yet in the dialog
    }
    return availablePackages.filter(
      (pkg) => pkg.zone_id === selectedRow.zone_id
    );
  }, [availablePackages, selectedRow?.zone_id]);

  return (
    <div className="p-6">
      {isLoading && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} />

      <DataTable
        data={providers}
        columns={columns}
          showAddButton={hasPermission("ProviderAdd")} // هذا يتحكم في إرسال الـ prop من الأساس

        addRoute={`/mall/single-page-m/${id}/add`}
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
  showEditButton={hasPermission("ProviderEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
  showDeleteButton={hasPermission("ProviderDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
  showActions={
    hasPermission("ProviderEdit") ||
    hasPermission("ProviderDelete") 
  }
        searchKeys={[
          "name",
          "serviceName",
          "location",
          "villageName", // Search by package name
          "zoneName",
        ]}
        showFilter={true}
        filterOptions={filterOptions}
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            zones={availableProvider}
            village={availablePackages} // Pass all available packages
            services={availableServices}
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Provider Name
              </label>
              <Input
                label="Provider Name"
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="location" className="text-gray-400 !pb-3">
                Location
              </label>
              <MapLocationPicker
                value={selectedRow?.map || ""}
                onChange={(newValue) => onChange("map", newValue)}
                placeholder="Search or select location on map"
              />

              <label htmlFor="zone" className="text-gray-400 !pb-3">
                Zone
              </label>
              <Select
                value={selectedRow?.zone_id?.toString() || ""}
                onValueChange={(value) => onChange("zone_id", value)}
                disabled={availableProvider.length === 0}
              >
                <SelectTrigger
                  id="zone"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {availableProvider.length > 0 ? (
                    availableProvider.map((zone) => (
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
                      value="no-zones"
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

              <label htmlFor="phone" className="text-gray-400 !pb-3">
                Phone
              </label>
              <Input
                label="phone"
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
                disabled={availableServices.length === 0}
              >
                <SelectTrigger
                  id="service"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {availableServices.length > 0 ? (
                    availableServices.map((service) => (
                      <SelectItem
                        key={service.id}
                        value={service.id.toString()}
                        className="text-bg-primary"
                      >
                        {service.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem
                      value="no-services"
                      className="text-bg-primary"
                      disabled
                    >
                      No services available
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
            name={selectedRow.name}
          />
        </>
      )}
    </div>
  );
};
export default Providers;