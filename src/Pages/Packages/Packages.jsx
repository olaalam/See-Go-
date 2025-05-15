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

const Subscription = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [subscriptions, setsubscriptions] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const token = localStorage.getItem("token");

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
      console.log("All responsive data:", result); // تحقق من البيانات الكاملة

      const formattedServices = (result.service_types || []).map((service) => {
        const currentLang = localStorage.getItem("lang") || "en";
        const name =
          service.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || service.name;
        return {
          id: service.id,
          name,
        };
      });

      console.log("Formatted services:", formattedServices); // تحقق من تنسيق الخدمات
      setServices(formattedServices); // تحديث الحالة بالخدمات
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchsubscriptions = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/subscription",
        {
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();
      console.log("all responsive", result);
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = (result.packages || []).map((subscription) => {
        const translations = subscription.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name =
          translations[currentLang]?.name || subscription.name || "—";
        const type =
          translations[currentLang]?.type || subscription.type || "—";
        const description =
          translations[currentLang]?.description ||
          subscription.description ||
          "—";
        const serviceName =
          subscription.service?.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value ||
          subscription.service?.name ||
          "—";

        const price = subscription.price || "—";
        const discount = subscription.discount || "—";
        const feez = subscription.feez || "—";

        return {
          id: subscription.id,
          name,
          type,
          description,
          status: subscription.status === 1 ? "Active" : "Inactive",
          service_id: subscription.service_id,
          serviceName,
          price,
          discount,
          feez,
        };
      });

      setsubscriptions(formatted);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      dispatch(hideLoader());
    }
  };
  useEffect(() => {
    console.log("services loaded:", services);
  }, [services]);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchsubscriptions(), fetchServices()]);
    };
    fetchData();
  }, []);

  const handleEdit = async (subscription) => {
    if (services.length === 0) {
      await fetchServices();
    }

    setselectedRow({
      ...subscription,
      service_id: subscription.service_id ?? subscription.service?.id ?? "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (subscription) => {
    setselectedRow(subscription);
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
      type,
      description,
      status,
      discount,
      service_id,
      price,
      feez,
    } = selectedRow;

    if (!service_id || isNaN(service_id)) {
      toast.error("Service ID is missing or invalid");
      return;
    }

    const updatedsubscription = new FormData();
    updatedsubscription.append("id", id);
    updatedsubscription.append("name", name || "");
    updatedsubscription.append("feez", feez || "");
    updatedsubscription.append("description", description || "");
    updatedsubscription.append("status", status === "Active" ? "1" : "0");
    updatedsubscription.append("service_id", service_id);
    updatedsubscription.append("price", price || "");
    updatedsubscription.append("type", type || "");
    updatedsubscription.append("discount", discount || "");
    if (type === "village") {
        updatedsubscription.append("admin_num", selectedRow.admin_num || "0");
        updatedsubscription.append("security_num", selectedRow.security_num || "0");
        updatedsubscription.append("maintenance_module", selectedRow.maintenance_module || "0");
        updatedsubscription.append("beach_pool_module", selectedRow.beach_pool_module || "0");
      }
      
      

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/subscription/update/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updatedsubscription,
        }
      );

      if (response.ok) {
        toast.success("subscription updated successfully!");
        const responseData = await response.json();

        setsubscriptions((prev) =>
          prev.map((subscription) =>
            subscription.id === id
              ? {
                  ...subscription,
                  name: responseData?.subscription?.name || name,
                  status:
                    responseData?.subscription?.status === 1
                      ? "Active"
                      : "Inactive",
                  image_link:
                    responseData?.subscription?.image_link ||
                    subscription.image_link,
                  price: responseData?.subscription?.price,
                  type: responseData?.subscription?.type,
                  discount: responseData?.subscription?.discount,
                  feez: responseData?.subscription?.feez,
                  description: responseData?.subscription?.description,
                  service_id: responseData?.subscription?.service_id,
                  security_num: responseData?.subscription?.security_num,
                  admin_num: responseData?.subscription?.admin_num,
                  maintenance_module: responseData?.subscription?.maintenance_module,
                  beach_pool_module: responseData?.subscription?.beach_pool_module,
                  
                }
              : subscription
          )
        );
        setIsEditOpen(false);
        setselectedRow(null);
        await fetchsubscriptions();
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update subscription!");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Error occurred while updating subscription!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/subscription/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("subscription deleted successfully!");
        setsubscriptions(
          subscriptions.filter(
            (subscription) => subscription.id !== selectedRow.id
          )
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete subscription!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting subscription!", error);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => ({
      ...prev,
      [key]: key === "service_id" ? parseInt(value, 10) : value,
    }));
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/subscription/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("subscription status updated successfully!");
        setsubscriptions((prevsubscriptions) =>
          prevsubscriptions.map((subscription) =>
            subscription.id === id
              ? {
                  ...subscription,
                  status: newStatus === 1 ? "Active" : "Inactive",
                }
              : subscription
          )
        );
      } else {
        toast.error("Failed to update subscription status!");
      }
    } catch (error) {
      toast.error("Error occurred while updating subscription status!", error);
    }
  };
  useEffect(() => {
    console.log("services loaded:", services);
  }, [services]);

  const columns = [
    { key: "type", label: "Type" },
    { key: "name", label: "Name " },

    { key: "serviceName", label: "Service " },
    { key: "price", label: "price" },
    { key: "description", label: "description" },

    { key: "discount", label: "Discount" },
    { key: "feez", label: "Fees" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={subscriptions}
        columns={columns}
        addRoute="/packages/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
                  searchKeys={["name", "serviceName","type"]}

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
                Subscription Name
              </label>
              <Input
                label="Subscription Name"
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
<label htmlFor="type" className="text-gray-400 !pb-3">
  Type
</label>
<Select
  value={selectedRow?.type || ""}
  onValueChange={(value) => onChange("type", value)}
>
  <SelectTrigger
    id="type"
    className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
  >
    <SelectValue placeholder="Select type" />
  </SelectTrigger>
  <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
    <SelectItem value="provider" className="text-bg-primary">Provider</SelectItem>
    <SelectItem value="village" className="text-bg-primary">Village</SelectItem>
  </SelectContent>
</Select>

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
              <label htmlFor="feez" className="text-gray-400 !pb-3">
                fees
              </label>
              <Input
                label="feez"
                id="feez"
                value={selectedRow?.feez || ""}
                onChange={(e) => onChange("feez", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />


              {selectedRow?.type === "village" && (
  <>
    <label htmlFor="admin_num" className="text-gray-400 !pb-3">
      Admin Number
    </label>
    <Input
      id="admin_num"
      value={selectedRow?.admin_num || ""}
      onChange={(e) => onChange("admin_num", e.target.value)}
      className="!my-2 text-bg-primary !p-4"
    />

    <label htmlFor="security_num" className="text-gray-400 !pb-3">
      Security Number
    </label>
    <Input
      id="security_num"
      value={selectedRow?.security_num || ""}
      onChange={(e) => onChange("security_num", e.target.value)}
      className="!my-2 text-bg-primary !p-4"
    />

    <label htmlFor="maintenance_module" className="text-gray-400 !pb-3">
      Maintenance Module (0 or 1)
    </label>
    <Input
      id="maintenance_module"
      type="number"
      min="0"
      max="1"
      value={selectedRow?.maintenance_module || ""}
      onChange={(e) => onChange("maintenance_module", e.target.value)}
      className="!my-2 text-bg-primary !p-4"
    />

    <label htmlFor="beach_pool_module" className="text-gray-400 !pb-3">
      Beach/Pool Module (0 or 1)
    </label>
    <Input
      id="beach_pool_module"
      type="number"
      min="0"
      max="1"
      value={selectedRow?.beach_pool_module || ""}
      onChange={(e) => onChange("beach_pool_module", e.target.value)}
      className="!my-2 text-bg-primary !p-4"
    />
  </>
)}
              <label htmlFor="price" className="text-gray-400 !pb-3">
                price
              </label>
              <Input
                type="number"
                label="price"
                id="price"
                value={selectedRow?.price || ""}
                onChange={(e) => onChange("price", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="discount" className="text-gray-400 !pb-3">
                discount
              </label>
              <Input
                type="number"
                label="discount"
                id="discount"
                value={selectedRow?.discount || ""}
                onChange={(e) => onChange("discount", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

{selectedRow?.type === "provider" && (
  <>
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
          <SelectItem value={null} className="text-bg-primary" disabled>
            No services available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  </>
)}

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

export default Subscription;
