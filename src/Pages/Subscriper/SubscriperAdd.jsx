import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function Addsubscrier() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [optionsData, setOptionsData] = useState({
    types: [],
    paymentMethods: [],
    providerPackages: [],
    villagePackages: [],
    services: [],
    villages: [],
    providers: [],
  });

  const [formData, setFormData] = useState({
    type: "",
    payment_method_id: "",
    package_id: "",
    service_id: "",
    village_id: "",
    provider_id: "",
  });

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
          paymentMethods: data.payment_methods?.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })) || [],
          providerPackages: data.provider_packages?.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })) || [],
          villagePackages: data.village_packages?.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })) || [],
          services: data.services?.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })) || [],
          villages: data.villages?.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })) || [],
          providers: data.providers?.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })) || [],
        });
      } catch (error) {
        console.error("Error fetching options", error);
      }
    };

    fetchOptions();
  }, []);

  const handleFieldChange = (name, value) => {
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
  }

  console.log("Submitting form with data:", Object.fromEntries(body.entries()));

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
      });
        navigate("/subscripers");
    } else {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      toast.error(errorData.message || "Failed to add subscriber.", {
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


  const baseFields = [
    {
      type: "select",
      placeholder: "Type",
      name: "type",
      options: [
        { value: "provider", label: "provider" },
        { value: "village", label: "village" },
      ],
    },
    {
      type: "select",
      placeholder: "Payment Method",
      name: "payment_method_id",
      options: optionsData.paymentMethods,
    },
    {
      type: "select",
      placeholder: "Package",
      name: "package_id",
      options: dynamicPackageOptions,
    },
  ];

  let dynamicFields = [];

  if (formData.type === "provider") {
    dynamicFields = [
      {
        type: "select",
        placeholder: "Service",
        name: "service_id",
        options: optionsData.services,
      },
      {
        type: "select",
        placeholder: "Provider",
        name: "provider_id",
        options: optionsData.providers,
      },
    ];
  } else if (formData.type === "village") {
    dynamicFields = [
      {
        type: "select",
        placeholder: "Village",
        name: "village_id",
        options: optionsData.villages,
      },
    ];
  }

  const fields = [...baseFields, ...dynamicFields];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Subscriber
      </h2>

      <Add
        fields={fields}
        lang="en"
        values={formData}
        onChange={(lang, name, value) => handleFieldChange(name, value)}
      />

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
