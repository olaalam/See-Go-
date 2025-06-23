import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AddSubscription() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedType = searchParams.get('type') || '';
  
  // State management
  const [services, setServices] = useState([]);
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      price: "",
      service: "",
      type: preSelectedType,
      status: "active",
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
    },
  });

  // Initialize token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      toast.error("Authentication required");
      navigate('/login');
      return;
    }
    setToken(storedToken);
  }, [navigate]);

  // Fetch services when component mounts or token changes
  useEffect(() => {
    if (token) {
      fetchServices();
    }
  }, [token]);

  const fetchServices = async () => {
    if (!token) return;

    try {
      dispatch(showLoader());
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/service_type",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services. Please try again.");
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleFieldChange = (lang, name, value) => {
    setFormData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [name]: value,
      },
    }));
  };

  const validateForm = () => {
    const { en } = formData;
    
    // Required field validation
    if (!en.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    
    if (!en.type) {
      toast.error("Type is required");
      return false;
    }
    
    if (!en.price || isNaN(en.price) || parseFloat(en.price) < 0) {
      toast.error("Valid price is required");
      return false;
    }
    
    // Provider specific validation
    if (en.type === "provider" && !en.service) {
      toast.error("Service is required for provider type");
      return false;
    }
    
    // Discount validation
    if (en.discount && (isNaN(en.discount) || parseFloat(en.discount) < 0 || parseFloat(en.discount) > 100)) {
      toast.error("Discount must be between 0 and 100");
      return false;
    }
    
    return true;
  };

  // Function to get the appropriate tab based on package type
  const getTabForType = (type) => {
    switch (type) {
      case "village":
        return "village";
      case "provider":
        return "provider";
      case "maintenance_provider":
        return "maintenance";
      default:
        return "all"; // Default tab
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    if (!validateForm()) {
      return;
    }

    dispatch(showLoader());

    try {
      const body = new FormData();
      
      // Add English fields
      body.append("name", formData.en.name.trim());
      body.append("description", formData.en.description.trim());
      body.append("type", formData.en.type);
      body.append("price", formData.en.price);
      body.append("discount", formData.en.discount || "0");
      body.append("status", formData.en.status === "active" ? "1" : "0");
      body.append("feez", formData.en.feez || "0");

      // Add service_id only for provider type
      if (formData.en.type === "provider" && formData.en.service) {
        body.append("service_id", formData.en.service);
      }

      // Add village specific fields
      if (formData.en.type === "village") {
        body.append("admin_num", formData.en.admin_num || "0");
        body.append("security_num", formData.en.security_num || "0");
        body.append("maintenance_module", formData.en.maintenance_module || "0");
        body.append("beach_pool_module", formData.en.beach_pool_module || "0");
      }

      // Add Arabic fields
      body.append("ar_name", formData.ar.name.trim());
      body.append("ar_description", formData.ar.description.trim());

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

      const result = await response.json();

      if (response.ok) {
        toast.success("Subscription added successfully!");
        
        // Get the appropriate tab for the package type
        const targetTab = getTabForType(formData.en.type);
        
        // Reset form
        setFormData({
          en: {
            name: "",
            description: "",
            price: "",
            service: "",
            type: "",
            status: "active",
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
          },
        });
        
        // Navigate to packages page with the appropriate tab
        setTimeout(() => {
          navigate(`/packages?tab=${targetTab}`);
        }, 2000);
        
      } else {
        toast.error(result.message || "Failed to add subscription.");
      }
    } catch (error) {
      console.error("Error submitting subscription:", error);
      toast.error("An error occurred! Please check your connection and try again.");
    } finally {
      dispatch(hideLoader());
    }
  };

  const selectedType = formData.en.type;

  // Dynamic fields based on selected type
  const fields = [
    { 
      type: "input", 
      placeholder: "Name", 
      name: "name", 
      lang: "en",
      required: true 
    },
    {
      type: "input",
      placeholder: "Description",
      name: "description",
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Type ",
      name: "type",
      options: [
        { label: "Provider", value: "provider" },
        { label: "Village", value: "village" },
        { label: "Maintenance", value: "maintenance_provider" },
      ],
      lang: "en",
      required: true,
    },
    ...(selectedType === "provider"
      ? [
          {
            type: "select",
            placeholder: "Service ",
            name: "service",
            options: services,
            lang: "en",
            required: true,
          },
        ]
      : []),
    { 
      type: "number", 
      placeholder: "Price ", 
      name: "price", 
      lang: "en",
      required: true,
      min: 0 
    },
    { 
      type: "number", 
      placeholder: "Fees", 
      name: "feez", 
      lang: "en",
      min: 0 
    },
    { 
      type: "number", 
      placeholder: "Discount (%)", 
      name: "discount", 
      lang: "en",
      min: 0,
      max: 100 
    },

    // Arabic fields
    {
      type: "input",
      placeholder: "الاسم (اختياري)",
      name: "name",
      lang: "ar",
    },
    {
      type: "input",
      placeholder: "الوصف (اختياري)",
      name: "description",
      lang: "ar",
    },
        {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "binary",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      lang: "en",
    },
    // Village specific fields
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
              { label: "Disabled", value: "0" },
              { label: "Enabled", value: "1" },
            ],
            lang: "en",
          },
          {
            type: "select",
            placeholder: "Beach/Pool Module",
            name: "beach_pool_module",
            options: [
              { label: "Disabled", value: "0" },
              { label: "Enabled", value: "1" },
            ],
            lang: "en",
          },
          
        ]
      : []),
  ];

  return (
    <div className="w-full !p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer position="top-right" />

      <div className="max-w-4xl mx-auto">
        <h2 className="text-bg-primary text-center !pb-10 text-2xl font-semibold !mb-10">
          Add New Package
        </h2>

        <div className=" !p-6">
          <Add
            fields={fields}
            values={{ en: formData.en, ar: formData.ar }}
            onChange={handleFieldChange}
          />

          <div className="flex justify-end gap-4 !mt-8 !pt-6 ">
            <Button
              onClick={() => navigate("/packages")}
              variant="outline"
              className="!px-6 !py-2 border-bg-primary text-bg-primary hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-bg-primary hover:bg-teal-600 !px-8 !py-2 text-white rounded-lg transition-all duration-200"
            >
              {isLoading ? "Adding..." : "Add Package"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}