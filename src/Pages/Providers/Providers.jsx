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

const Providers = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]); // Store original fetched data
  // ستتم تعبئة هذه الحالات من استجابة الـ providers
  const [village, setVillage] = useState([]);
  const [zones, setZones] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // New state for filter selections
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("all");
  const [selectedVillageFilter, setSelectedVillageFilter] = useState("all");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
      const response = await fetch("https://bcknd.sea-go.org/admin/provider", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      // 1. Populate Zones state from result.zone
      const formattedZones = (result.zones || []).map((zone) => {
        const name =
          zone.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || zone.name;
        return { id: zone.id, name: name };
      });
      setZones(formattedZones);

      // 2. Populate Village state from result.village
      const formattedVillages = (result.villages || []).map((v) => {
        const name =
          v.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || v.name;
        return { id: v.id, name: name, zone_id: v.zone_id };
      });
      setVillage(formattedVillages);

      // 3. Populate Services state from result.services_types
      const formattedServices = (result.services_types || []).map((service) => {
        const name =
          service.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || service.name;
        return { id: service.id, name: name };
      });
      setServices(formattedServices);

      // 4. Process providers array
      const formatted = (result.providers || []).map((provider) => {
        const translations =
          provider.translations?.reduce((acc, t) => {
            if (!acc[t.locale]) acc[t.locale] = {};
            acc[t.locale][t.key] = t.value;
            return acc;
          }, {}) || {};

        const name = translations[currentLang]?.name || provider.name || "—";
        const rawName = name; // للاستخدام في حقول الإدخال

        const nameClickable = (
          <span
            onClick={() => navigate(`/providers/single-page-p/${provider.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer "
          >
            {name}
          </span>
        );
        const map =
          translations[currentLang]?.location || provider.location || "—";
        const description =
          translations[currentLang]?.description || provider.description || "—";

        // Find service name from the comprehensive services list
        const serviceObj = formattedServices.find(
          (s) => s.id === provider.service_id
        );
        const serviceName = serviceObj ? serviceObj.name : "—";

        const image =
          provider?.image_link && !imageErrors[provider.id] ? (
            <img
              src={provider.image_link}
              alt={provider.name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(provider.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        const phone = provider.phone || "—";
        const rating = provider.rate || "—";

        // Find village name from the comprehensive village list
        const villageObj = formattedVillages.find(
          (v) => v.id === provider.village_id
        );
        const villageName = villageObj ? villageObj.name : "—";

        // Find zone name and ID using the village_id from the provider and the comprehensive lists
        let zoneName = "—";
        let zone_id = null;
        if (villageObj && villageObj.zone_id) {
          const zoneObj = formattedZones.find(
            (z) => z.id === villageObj.zone_id
          );
          if (zoneObj) {
            zoneName = zoneObj.name;
            zone_id = zoneObj.id;
          }
        }

        return {
          id: provider.id,
          name: nameClickable,
          rawName,
          map,
          description,
          img: image,
          numberOfproviders: provider.providers_count ?? "0",
          status: provider.status === 1 ? "Active" : "Inactive",
          service_id: provider.service_id,
          serviceName,
          phone,
          rating,
          image_link: provider.image_link,
          villageName,
          village_id: provider.village_id,
          zoneName,
          zone_id, // تأكد من وجود zone_id هنا
          open_from: provider.open_from,
          open_to: provider.open_to,
        };
      });

      setAllProviders(formatted); // Store the full list
      setProviders(formatted); // Initialize displayed providers
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("حدث خطأ أثناء جلب البيانات!");
    } finally {
      dispatch(hideLoader());
    }
  };

  // جلب بيانات المزودين عند تحميل المكون لأول مرة
  useEffect(() => {
    fetchProviders();
  }, []); // لا توجد تبعيات، يتم التشغيل مرة واحدة عند التحميل

  // Filtering logic using useMemo to optimize performance
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

    if (selectedStatusFilter !== "all") {
      // Note: 'status' in data is "Active" or "Inactive", filter values are "active" or "inactive"
      currentFilteredProviders = currentFilteredProviders.filter(
        (provider) =>
          provider.status.toLowerCase() === selectedStatusFilter.toLowerCase()
      );
    }

    return currentFilteredProviders;
  }, [
    allProviders,
    selectedZoneFilter,
    selectedVillageFilter,
    selectedServiceFilter,
    selectedStatusFilter,
  ]);

  useEffect(() => {
    // Update displayed providers whenever filters change
    setProviders(filteredProviders);
  }, [filteredProviders]);

  const handleEdit = async (provider) => {
    setselectedRow({
      ...provider,
      service_id: provider.service_id ?? "",
      name: provider.rawName, // استخدام rawName هنا للحقل النصي
      open_from: provider.open_from || "",
      open_to: provider.open_to || "",
      zone_id: provider.zone_id, // التأكد من تمرير zone_id
      village_id: provider.village_id, // التأكد من تمرير village_id
    });
    setIsEditOpen(true);
  };

  const handleDelete = (provider) => {
    setselectedRow(provider);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    if (isEditOpen && selectedRow) {
      console.log(
        "service_id عند فتح الـ Edit Dialog:",
        selectedRow.service_id
      );
      console.log("selectedRow data عند فتح الـ Edit Dialog:", selectedRow);
    }
  }, [isEditOpen, selectedRow]);

  const handleSave = async () => {
    const {
      id,
      name, // هذا هو rawName الآن
      description,
      status,
      service_id,
      village_id,
      zone_id, // يجب أن يكون متوفراً
      phone,
      open_from,
      open_to,
      map: location, // الحصول على الموقع من selectedRow
    } = selectedRow;

    // تحقق من الحقول المفتوحة
    if (!village_id || isNaN(parseInt(village_id, 10))) {
      toast.error("Village ID is missing or invalid");
      return;
    }
    if (!service_id || isNaN(parseInt(service_id, 10))) {
      toast.error("Service ID is missing or invalid");
      return;
    }
    // No need to check zone_id here if it's derived from village_id in the backend,
    // but keep it for consistency if your API expects it.
    if (!zone_id || isNaN(parseInt(zone_id, 10))) {
      toast.error("Zone ID is missing or invalid");
      return;
    }

    const updatedProvider = new FormData();
    updatedProvider.append("id", id);
    updatedProvider.append("name", name || "");
    updatedProvider.append("location", location || ""); // استخدام قيمة الموقع
    updatedProvider.append("description", description || "");
    updatedProvider.append("status", status === "Active" ? "1" : "0");
    updatedProvider.append("service_id", parseInt(service_id, 10));
    updatedProvider.append("phone", phone || "");
    updatedProvider.append("village_id", parseInt(village_id, 10));
    updatedProvider.append("zone_id", parseInt(zone_id, 10)); // أرسل zone_id

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
    };

    updatedProvider.append("open_from", formatTimeWithSeconds(open_from));
    updatedProvider.append("open_to", formatTimeWithSeconds(open_to));

    if (selectedRow.imageFile) {
      updatedProvider.append("image", selectedRow.imageFile);
    } else if (selectedRow.image_link) {
      // إذا لم يتم رفع صورة جديدة ولكن هناك رابط صورة موجود، قد تحتاج Backend لمعرفة ذلك.
      // لا يتم عادة إرسال image_link كـ "fallback" هنا، بل إما الصورة الجديدة أو لا شيء إذا لم تتغير.
      // هذا الجزء يعتمد على كيفية توقع الـ Backend للصور الموجودة.
      // For now, retaining original logic for existing image link handling.
      // updatedProvider.append("image_link_fallback", selectedRow.image_link); // Example: send as a fallback
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/update/${id}`,
        {
          method: "POST", // تأكد أن الـ API يقبل POST مع FormData
          headers: {
            Authorization: `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' لا يتم وضعها هنا عند استخدام FormData
          },
          body: updatedProvider,
        }
      );

      if (response.ok) {
        toast.success("Provider updated successfully!");
        fetchProviders(); // إعادة جلب المزودين لتحديث الجدول
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
        setProviders(
          providers.filter((provider) => provider.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
        // After deletion, re-apply filters to the remaining allProviders
        setAllProviders(
          allProviders.filter((provider) => provider.id !== selectedRow.id)
        );
      } else {
        toast.error("Failed to delete provider!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting provider!", error);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => {
      let newValue = value;
      // تحويل القيم إلى أرقام صحيحة إذا كانت service_id, village_id, zone_id
      if (key === "service_id" || key === "village_id" || key === "zone_id") {
        newValue = parseInt(value, 10);
      }

      // If village_id changes, update zone_id based on the selected village's zone_id
      if (key === "village_id") {
        const selectedVillage = village.find(
          (v) => v.id === parseInt(value, 10)
        );
        if (selectedVillage) {
          return {
            ...prev,
            [key]: newValue,
            zone_id: selectedVillage.zone_id, // Update zone_id automatically
            rawName: key === "name" ? value : prev.rawName,
          };
        }
      }

      return {
        ...prev,
        [key]: newValue,
        // تأكد من أن rawName يتحدث فقط عندما يكون المفتاح هو 'name'
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
        image_link: URL.createObjectURL(file), // لعرض معاينة فورية للصورة الجديدة
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
        // Update allProviders and let useMemo re-calculate filteredProviders
        setAllProviders((prevAllProviders) =>
          prevAllProviders.map((provider) =>
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
    { key: "name", label: "Provider " },
    { key: "img", label: "Image" },
    { key: "zoneName", label: "Zone" },
    { key: "serviceName", label: "Service " },
    { key: "villageName", label: "Village" },
    { key: "phone", label: "Phone" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
  ];

  // Modified filterOptionsForVillages to include onChange handlers
  const filterOptionsForVillages = [
    {
      key: "zone",
      label: "Filter by Zone",
      options: [
        { value: "all", label: "All Zones" },
        ...zones.map((zone) => ({ value: zone.name, label: zone.name })),
      ],
      selectedValue: selectedZoneFilter, // Pass current selected value
      onValueChange: setSelectedZoneFilter, // Pass setter function
    },
    {
      key: "village",
      label: "Filter by Village",
      options: [
        { value: "all", label: "All Villages" },
        ...village.map((v) => ({
          value: v.name,
          label: v.name,
        })),
      ],
      selectedValue: selectedVillageFilter,
      onValueChange: setSelectedVillageFilter,
    },
    {
      key: "service",
      label: "Filter by Service",
      options: [
        { value: "all", label: "All Services" },
        ...services.map((service) => ({
          value: service.name,
          label: service.name,
        })),
      ],
      selectedValue: selectedServiceFilter,
      onValueChange: setSelectedServiceFilter,
    },
    {
      key: "status",
      label: "Filter by Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      selectedValue: selectedStatusFilter,
      onValueChange: setSelectedStatusFilter,
    },
  ];

  return (
    <div className="p-6">
      {isLoading && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} />

      <DataTable
        data={providers} // Pass the filtered data here
        columns={columns}
        addRoute="/providers/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={[
          "name",
          "serviceName",
          "location",
          "villageName",
          "zoneName",
        ]}
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
            zones={zones} // يتم تمرير zones التي تم استخلاصها
            village={village} // يتم تمرير village التي تم استخلاصها
            services={services} // يتم تمرير services التي تم استخلاصها
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Provider Name
              </label>
              <Input
                label="Provider Name"
                id="name"
                value={selectedRow?.name}
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
                disabled={services.length === 0}
              >
                <SelectTrigger
                  id="service"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {services.length > 0 ? (
                    services.map((service) => (
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
                      value={null}
                      className="text-bg-primary"
                      disabled
                    >
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