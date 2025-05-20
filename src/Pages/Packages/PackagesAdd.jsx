import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddSubscription() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [services, setServices] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      price: "",
      service: "",
      type: "",
      status: "",
      feez: "",
      discount: "",
      admin_num: "",
      security_num: "",
      maintenance_module: "0",
      beach_pool_module: "0",
    },
    ar: {
      name: "",
      description: "",
      price: "",
      service: "",
      type: "",
      status: "",
      feez: "",
      discount: "",
    },
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          "https://bcknd.sea-go.org/admin/service_type",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.service_types) {
          setServices(
            data.service_types.map((service) => ({
              label: service.name,
              value: service.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching services", error);
      }
    };

    fetchServices();
  }, []);

  const handleFieldChange = (lang, name, value) => {
    setFormData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.en.name);
    body.append("description", formData.en.description);
    if (formData.en.type === "provider") {
      body.append("service_id", formData.en.service);
    }
    body.append("type", formData.en.type);
    body.append("price", formData.en.price);
    body.append("discount", formData.en.discount);
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("feez", formData.en.feez || "");

    if (formData.en.type === "village") {
      body.append("admin_num", formData.en.admin_num || "0");
      body.append("security_num", formData.en.security_num || "0");
      body.append("maintenance_module", formData.en.maintenance_module || "0");
      body.append("beach_pool_module", formData.en.beach_pool_module || "0");
    }

    body.append("ar_name", formData.ar.name);
    body.append("ar_description", formData.ar.description);
    navigate("/packages");

    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/subscription/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        toast.success("Subscription added successfully!");
        setFormData({
          en: {
            name: "",
            description: "",
            price: "",
            service: "",
            type: "",
            status: "",
            feez: "",
            discount: "",
            admin_num: "",
            security_num: "",
            maintenance_module: "0",
            beach_pool_module: "0",
          },
          ar: {
            name: "",
            description: "",
            price: "",
            service: "",
            type: "",
            status: "",
            feez: "",
            discount: "",
          },
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to add subscription.");
      }
    } catch (error) {
      console.error("Error submitting subscription:", error);
      toast.error("An error occurred!");
    } finally {
      dispatch(hideLoader());
    }
  };

  const selectedType = formData.en.type;

  // Combine English and Arabic fields into a single array
  const fields = [
    { type: "input", placeholder: "Name", name: "name", lang: "en" },
    {
      type: "input",
      placeholder: "Description",
      name: "description",
      lang: "en",
    },
    ...(selectedType === "provider"
      ? [
          {
            type: "select",
            placeholder: "Service",
            name: "service",
            options: services,
            lang: "en",
          },
        ]
      : []),
    {
      type: "select",
      placeholder: "Type",
      name: "type",
      options: [
        { label: "Provider", value: "provider" },
        { label: "Village", value: "village" },
      ],
      lang: "en",
    },
    { type: "input", placeholder: "Discount", name: "discount", lang: "en" },
    { type: "input", placeholder: "Price", name: "price", lang: "en" },
    { type: "input", placeholder: "Fees", name: "feez", lang: "en" },
    {
      type: "select",
      placeholder: "Status",
      name: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      lang: "en",
    },
    {
      type: "input",
      placeholder: " (اختياري) الاسم",
      name: "name",
      lang: "ar",
    },
    {
      type: "input",
      placeholder: " (اختياري) الوصف",
      name: "description",
      lang: "ar",
    },

    ...(selectedType === "village"
      ? [
          {
            type: "input",
            placeholder: "Admin Number",
            name: "admin_num",
            lang: "en",
          },
          {
            type: "input",
            placeholder: "Security Number",
            name: "security_num",
            lang: "en",
          },
          {
            type: "select",
            placeholder: "Maintenance Module",
            name: "maintenance_module",
            options: [
              { label: "Enabled", value: "1" },
              { label: "Disabled", value: "0" },
            ],
            lang: "en",
          },
          {
            type: "select",
            placeholder: "Beach/Pool Module",
            name: "beach_pool_module",
            options: [
              { label: "Enabled", value: "1" },
              { label: "Disabled", value: "0" },
            ],
            lang: "en",
          },
        ]
      : []),
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Packages
      </h2>

      <div className="w-[90%] mx-auto">
        {/* Pass all fields to a single Add component */}
        <Add
          fields={fields}
          values={{ en: formData.en, ar: formData.ar }}
          onChange={handleFieldChange}
        />
      </div>

      <div className="!my-6">
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
