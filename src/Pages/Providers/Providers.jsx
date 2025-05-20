"use client";
import { useEffect, useState } from "react";

import DataTable from "@/components/DataTableLayout";

import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import EditDialog from "@/components/EditDialog"; // تأكد من استيراد EditDialog
import DeleteDialog from "@/components/DeleteDialog"; // تأكد من استيراد DeleteDialog

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

const Providers = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [providers, setProviders] = useState([]);
  const [village, setVillage] = useState([]);
  const [zones, setZones] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchZones = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/zone", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const currentLang = localStorage.getItem("lang") || "en";
      const formattedZones = (result.zones || []).map((zone) => { // تأكد من وجود result.zones
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

  const fetchServices = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/service_type", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      console.log("All responsive data:", result);
      const formattedServices = (result.service_types || []).map((service) => {
        const currentLang = localStorage.getItem("lang") || "ar";
        const name =
          service.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || service.name;
        return {
          id: service.id,
          name,
        };
      });

      console.log("Formatted services:", formattedServices);
      setServices(formattedServices);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

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
          zone_id: village.zone_id, // تأكد من جلب zone_id هنا
        };
      });
      console.log("Formatted villages:", formattedvillage);
      setVillage(formattedvillage);
    } catch (err) {
      console.error("Error fetching village:", err);
    }
  };

  const fetchProviders = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/provider", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = (result.providers || []).map((provider) => {
        const translations = provider.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || provider.name || "—";
        const rawName = name;

        const nameClickable = (
          <span
            onClick={() => navigate(`/providers/single-page-p/${provider.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer "
          >
            {name}
          </span>
        );
        const location =
          translations[currentLang]?.location || provider.location || "—";
        const description =
          translations[currentLang]?.description || provider.description || "—";
        const serviceName =
          provider.service?.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value ||
          provider.service?.name ||
          "—";

        const image = provider?.image_link ? (
          <img
            src={provider.image_link}
            alt={name}
            className="w-12 h-12 rounded-md object-cover aspect-square"
            onError={() => {}}
          />
        ) : (
          <Avatar className="w-12 h-12">
            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
          </Avatar>
        );

        const phone = provider.phone || "—";
        const rating = provider.rate || "—";

        const villageData = village.find((v) => v.id === provider.village_id);
        const villageName = villageData?.name || "—";
        const zoneData = zones.find((z) => z.id === villageData?.zone_id); // البحث عن الـ zone بناءً على villageData.zone_id
        const zoneName = zoneData?.name || "—";
        const zone_id = villageData?.zone_id || null; // حفظ zone_id هنا

        return {
          id: provider.id,
          name: nameClickable,
          rawName,
          location,
          description,
          img: image,
          numberOfproviders: provider.providers_count ?? "0",
          status: provider.status === 1 ? "Active" : "Inactive",
          service_id: provider.service_id,
          serviceName,
          phone,
          rating,
          villageName,
          village_id: provider.village_id,
          zoneName, // إضافة zoneName إلى الـ formatted provider
          zone_id, // إضافة zone_id إلى الـ formatted provider
          open_from: provider.open_from, // تأكد من جلبها من API
          open_to: provider.open_to,     // تأكد من جلبها من API
        };
      });

      setProviders(formatted);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    console.log("services loaded:", services);
  }, [services]);

  // يجب أن يتم جلب جميع البيانات الأساسية قبل جلب الـ providers
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchZones(); // جلب المناطق أولاً
      await fetchVillage(); // ثم القرى (لأن القرى تعتمد على المناطق)
      await fetchServices();
    };
    loadInitialData();
  }, []);

  // جلب الـ providers بعد التأكد من جلب village و zones
  useEffect(() => {
    if (village.length > 0 && zones.length > 0) { // تأكد من أن zones و village تم جلبها
      fetchProviders();
    }
  }, [village, zones]); // إضافة zones كاعتمادية

  const handleEdit = async (provider) => {
    if (services.length === 0) {
      await fetchServices();
    }
    setselectedRow({
      ...provider,
      service_id: provider.service_id ?? provider.service?.id ?? "",
      name: provider.rawName, // استخدام rawName هنا للحقل النصي
      open_from: provider.open_from || "", // تأكد من أن القيمة موجودة هنا
      open_to: provider.open_to || "",     // تأكد من أن القيمة موجودة هنا
      zone_id: provider.zone_id, // تأكد من تمرير zone_id
    });
    setIsEditOpen(true);
  };

  const handleDelete = (provider) => {
    setselectedRow(provider);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    if (isEditOpen && selectedRow) {
      console.log("service_id عند فتح الـ Edit Dialog:", selectedRow.service_id);
      console.log("selectedRow data عند فتح الـ Edit Dialog:", selectedRow); // تحقق من البيانات عند فتح نافذة التعديل
    }
  }, [isEditOpen, selectedRow]);

  const handleSave = async () => {
    const {
      id,
      name, // هذا هو rawName الآن
      location,
      description,
      status,
      service_id,
      village_id,
      zone_id, // استقبل zone_id
      phone,
      imageFile,
      open_from,
      open_to,
    } = selectedRow;

    // تحقق من الحقول المفتوحة
    if (!village_id || isNaN(parseInt(village_id, 10))) { // التأكد من التحويل لعدد صحيح
      toast.error("Village ID is missing or invalid");
      return;
    }
    if (!service_id || isNaN(parseInt(service_id, 10))) { // التأكد من التحويل لعدد صحيح
      toast.error("Service ID is missing or invalid");
      return;
    }
    if (!zone_id || isNaN(parseInt(zone_id, 10))) { // التحقق من zone_id
        toast.error("Zone ID is missing or invalid");
        return;
    }

    const updatedProvider = new FormData();
    updatedProvider.append("id", id);
    updatedProvider.append("name", name || "");
    updatedProvider.append("location", location || "");
    updatedProvider.append("description", description || "");
    updatedProvider.append("status", status === "Active" ? "1" : "0");
    updatedProvider.append("service_id", parseInt(service_id, 10)); // تأكد من إرساله كعدد صحيح
    updatedProvider.append("phone", phone || "");
    updatedProvider.append("village_id", parseInt(village_id, 10)); // تأكد من إرساله كعدد صحيح
    updatedProvider.append("zone_id", parseInt(zone_id, 10)); // أرسل zone_id

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      // تأكد من أن الوقت يتم إرساله بتنسيق 'HH:mm:ss' إذا كان API يتوقعه كذلك
      return time.length === 5 ? `${time}:00` : time;
    };

    updatedProvider.append("open_from", formatTimeWithSeconds(open_from));
    updatedProvider.append("open_to", formatTimeWithSeconds(open_to));

    if (imageFile) {
      updatedProvider.append("image", imageFile);
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/provider/update/${id}`,
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
        fetchProviders();
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
        setProviders((prevproviders) =>
          prevproviders.map((provider) =>
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

  useEffect(() => {
    // هذا useEffect يبدو متكرراً
    console.log("services loaded:", services);
  }, [services]);

  const columns = [
    { key: "name", label: "Provider " },
    { key: "serviceName", label: "Service " },
    { key: "location", label: "Location" },
    { key: "description", label: "description" },
    { key: "villageName", label: "Village" },
    { key: "zoneName", label: "Zone" }, // إضافة Zone كعمود في الجدول
    { key: "img", label: "Image" },
    { key: "phone", label: "Phone" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-6">
      {isLoading && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} />

      <DataTable
        data={providers}
        columns={columns}
        addRoute="/providers/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "serviceName", "location", "villageName", "zoneName"]} // إضافة zoneName للبحث
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
                    <label htmlFor="name" className="text-gray-400 !pb-3">
            Provider Name
          </label>
          <Input
            label="Provider Name"
            id="name"
            value={selectedRow?.name} // استخدام name لعرض القيمة الحالية
            onChange={(e) => onChange("name", e.target.value)}
            className="!my-2 text-bg-primary !p-4"
          />
          <label htmlFor="location" className="text-gray-400 !pb-3">
            Location
          </label>
          <Input
            label="location"
            id="location"
            value={selectedRow?.location || ""}
            onChange={(e) => onChange("location", e.target.value)}
            className="!my-2 text-bg-primary !p-4"
          />

          <label htmlFor="zone" className="text-gray-400 !pb-3">
            Zone
          </label>
          <Select
            value={selectedRow?.zone_id?.toString() || ""} // تأكد من أن القيمة سلسلة نصية
            onValueChange={(value) => onChange("zone_id", value)}
            disabled={zones.length === 0} // تعطيل السلكت إذا لم تكن هناك مناطق
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
                <SelectItem value={null} className="text-bg-primary" disabled>
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

          <label htmlFor="image" className="text-gray-400 !pb-3">
            Image
          </label>
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