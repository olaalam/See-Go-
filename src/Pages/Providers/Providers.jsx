"use client";

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
import { useNavigate } from "react-router-dom";

const Providers = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [providers, setProviders] = useState([]);
  const [village, setVillage] = useState([]);
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

      // التعديل هنا: استخدام result.villages بدلاً من result.village
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

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchVillage();
      await fetchServices();
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (village.length > 0) {
      fetchProviders();
    }
  }, [village]);

  const handleEdit = async (provider) => {
    if (services.length === 0) {
      await fetchServices();
    }

    setselectedRow({
      ...provider,
      service_id: provider.service_id ?? provider.service?.id ?? "",
      name: provider.name,
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
    }
  }, [isEditOpen, selectedRow]);

  const handleSave = async () => {
    const {
      id,
      name,
      location,
      description,
      status,
      service_id,
      village_id,
      phone,

      imageFile,
      open_from,
      open_to,
    } = selectedRow;

    // تحقق من الحقول المفتوحة
    if (!village_id || isNaN(village_id)) {
      toast.error("village ID is missing or invalid");
      return;
    }
    if (!service_id || isNaN(service_id)) {
      toast.error("Service ID is missing or invalid");
      return;
    }

    const updatedProvider = new FormData();
    updatedProvider.append("id", id);
updatedProvider.append("name", selectedRow.rawName || "");
    updatedProvider.append("location", location || "");
    updatedProvider.append("description", description || "");
    updatedProvider.append("status", status === "Active" ? "1" : "0");
    updatedProvider.append("service_id", service_id);
    updatedProvider.append("phone", phone || "");
    updatedProvider.append("village_id", village_id);

const formatTimeWithSeconds = (time) => {
  if (!time) return "";
  return time.length === 5 ? `${time}:00` : time; // لو HH:mm زود :00
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

        setProviders((prev) =>
          prev.map((provider) =>
            provider.id === id
              ? {
                  ...provider,
                  name: responseData?.provider?.name || name,
                  status:
                    responseData?.provider?.status === 1
                      ? "Active"
                      : "Inactive",
                  image_link:
                    responseData?.provider?.image_link || provider.image_link,
                  phone: responseData?.provider?.phone,
                  rating: responseData?.provider?.rating,
                  village_id: village_id,
                  villageName:
                    village.find((v) => v.id === parseInt(village_id))?.name ||
                    provider.villageName,
                  img: responseData?.provider?.image_link ? (
                    <img
                      src={responseData.provider.image_link}
                      alt={responseData?.provider?.name || name}
                      className="w-12 h-12 rounded-md object-cover aspect-square"
                      onError={() => {}}
                    />
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {responseData?.provider?.name?.charAt(0) ||
                          name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ),
                  open_from: responseData?.provider?.open_from || open_from,
                  open_to: responseData?.provider?.open_to || open_to,
                }
              : provider
          )
        );

        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update provider!");
      }
    } catch (error) {
      console.error("Error updating provider:", error);
      toast.error("Error occurred while updating provider!");
    }
  };
  useEffect(() => {
  console.log('selectedRow data:', selectedRow); // تحقق من البيانات عند فتح نافذة التعديل
}, [selectedRow]);


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
        toast.success("provider deleted successfully!");
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
  setselectedRow((prev) => ({
    ...prev,
    [key]: key === "service_id" ? parseInt(value, 10) : value,
    // تأكد من تحديث الاسم عند تغييره
    rawName: key === "name" ? value : prev.rawName,
  }));
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
        toast.success("provider status updated successfully!");
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
    console.log("services loaded:", services);
  }, [services]);

  const columns = [
    { key: "name", label: "Provider " },
    { key: "serviceName", label: "Service " },
    { key: "location", label: "Location" },
    { key: "description", label: "description" },
    { key: "villageName", label: "village" },
    { key: "img", label: "Image" },
    { key: "phone", label: "Phone" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={providers}
        columns={columns}
        addRoute="/providers/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "serviceName", "location"]}
      />
      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            services={services}
            onChange={onChange}
            className="!p-4"
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                provider Name
              </label>
<Input
  label="provider Name"
  id="name"
  value={selectedRow?.rawName}
  onChange={(e) => onChange("name", e.target.value)}
  className="!my-2 text-bg-primary !p-4"
/>


              <label htmlFor="location" className="text-gray-400 !pb-3">
                location
              </label>
              <Input
                label="location"
                id="location"
                value={selectedRow?.location || ""}
                onChange={(e) => onChange("location", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="description" className="text-gray-400 !pb-3">
                description
              </label>
              <Input
                label="description"
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              <label htmlFor="phone" className="text-gray-400 !pb-3">
                phone
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
                value={selectedRow?.service_id?.toString()}
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
                value={selectedRow?.village_id?.toString()}
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
