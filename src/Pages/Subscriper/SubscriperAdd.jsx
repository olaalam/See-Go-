import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate, useLocation } from "react-router-dom";

export default function Addsubscrier() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  // State to determine if the type field should be disabled
  const [isTypeFieldDisabled, setIsTypeFieldDisabled] = useState(false);

  const [optionsData, setOptionsData] = useState({
    paymentMethods: [],
    providerPackages: [],
    villagePackages: [],
    service_type: [],
    villages: [],
    providers: [],
    maintenanceProviders: [],
    maintenancePackages: [],
  });

  const [formData, setFormData] = useState({
    type: "",
    payment_method_id: "",
    package_id: "",
    service_id: "",
    village_id: "",
    provider_id: "",
    maintenance_provider_id: "",
  });

  // Effect to set initial form data based on navigation state
  useEffect(() => {
    if (location.state?.initialType) {
      setFormData((prev) => ({
        ...prev,
        type: location.state.initialType,
      }));
      // Disable the type field if it's set from navigation state
      setIsTypeFieldDisabled(true);
    } else {
      // Set a default type if accessed directly without state
      setFormData((prev) => ({
        ...prev,
        type: "provider", // Default to 'provider' if no initialType is provided
      }));
      // If no initialType, allow the user to select
      setIsTypeFieldDisabled(false);
    }
  }, [location.state]); // Rerun when location state changes

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(
          "https://bcknd.sea-go.org/admin/subscriper",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        console.log(data);

        setOptionsData({
          paymentMethods:
            data.payment_methods?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          providerPackages:
            data.provider_packages?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          villagePackages:
            data.village_packages?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          service_type:
            data.service_type?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          villages:
            data.villages?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          maintenancePackages:
            data.maintenance_provider_packages?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          providers:
            data.providers?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
          maintenanceProviders:
            data.maintenance_provider?.map((item) => ({
              label: item.name,
              value: item.id.toString(),
            })) || [],
        });
      } catch (error) {
        console.error("Error fetching options", error);
      }
    };

    fetchOptions();
  }, [token]);

  const handleInputChange = (name, value) => {
    // Prevent changing the type if it's disabled
    if (name === "type" && isTypeFieldDisabled) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const dynamicPackageOptions =
    formData.type === "provider"
      ? optionsData.providerPackages
      : formData.type === "village"
      ? optionsData.villagePackages
      : formData.type === "maintenance_provider"
      ? optionsData.maintenancePackages
      : [];

  const handleSubmit = async () => {
    dispatch(showLoader());

    const body = new FormData();
    body.append("type", formData.type);
    body.append("payment_method_id", formData.payment_method_id);
    body.append("package_id", formData.package_id);

    if (formData.type === "provider") {
      body.append("service_id", formData.service_id);
      body.append("provider_id", formData.provider_id);
    } else if (formData.type === "village") {
      body.append("village_id", formData.village_id);
    } else if (formData.type === "maintenance_provider") {
      body.append("maintenance_provider_id", formData.maintenance_provider_id);
    }

    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/subscriper/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        toast.success("Subscriber added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          type: "",
          payment_method_id: "",
          package_id: "",
          service_id: "",
          village_id: "",
          provider_id: "",
          maintenance_provider_id: "",
        });
        navigate("/subscribers");
      } else {
        let errorMessage = "Failed to add subscriber.";
        try {
          const errorData = await response.json();

          if (errorData?.errors && typeof errorData.errors === "object") {
            errorMessage = Object.values(errorData.errors).flat().join(", ");
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
          }
        } catch (jsonError) {
          console.error("Failed to parse error response", jsonError);
        }

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error submitting subscriber:", error);
      toast.error("An error occurred!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };



  let dynamicFields = [];

  if (formData.type === "provider") {
    dynamicFields = [
      {
        type: "select",
        placeholder: "Service",
        name: "service_id",
        options: optionsData.service_type || [],
      },
      {
        type: "select",
        placeholder: "Provider",
        name: "provider_id",
        options: optionsData.providers || [],
      },
    ];
  } else if (formData.type === "village") {
    dynamicFields = [
      {
        type: "select",
        placeholder: "Village",
        name: "village_id",
        options: optionsData.villages || [],
      },
    ];
  } else if (formData.type === "maintenance_provider") {
    dynamicFields = [
      {
        type: "select",
        placeholder: "Maintenance Provider",
        name: "maintenance_provider_id",
        options: optionsData.maintenanceProviders || [],
      },
    ];
  }
  const baseFields = [
    // {
    //   type: "select",
    //   placeholder: "Type",
    //   name: "type",
    //   options: [
    //     { value: "provider", label: "provider" },
    //     { value: "village", label: "village" },
    //     { value: "maintenance_provider", label: "maintenance" },
    //   ],
    //   value: formData.type,
    //   // Add the disabled property based on the state
    //   disabled: isTypeFieldDisabled, // <--- ADD THIS LINE
    // },
    {
      type: "select",
      placeholder: "Payment Method",
      name: "payment_method_id",
      options: optionsData.paymentMethods || [],
    },
    {
      type: "select",
      placeholder: "Package",
      name: "package_id",
      options: dynamicPackageOptions || [],
    },
  ];
  const fields = [...baseFields, ...dynamicFields];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Subscriber
      </h2>

      <Add fields={fields} values={formData} onChange={handleInputChange} />

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