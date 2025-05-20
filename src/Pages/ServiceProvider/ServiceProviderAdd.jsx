import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddServiceProvider() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const [village, setVillage] = useState([]);
  const navigate = useNavigate();
  const [maintenances, setMaintenances] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      phone: "",
      maintenance_type_id: "",
      village: "",
      location: "",
      status: "",
      image: null,
      open_from: "",
      open_to: "",
    },
    ar: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchServiceProvider = async () => {
      try {
        const response = await fetch(
          "https://bcknd.sea-go.org/admin/service_provider",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.maintenance_types) {
          setMaintenances(
            data.maintenance_types.map((maintenance) => ({
              label: maintenance.name,
              value: maintenance.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching maintenances", error);
      }
    };

    fetchServiceProvider();
  }, []);

  useEffect(() => {
    const fetchVillage = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/village", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.villages) {
          setVillage(
            data.villages.map((village) => ({
              label: village.name,
              value: village.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching Village", error);
      }
    };

    fetchVillage();
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
    body.append("maintenance_type_id", formData.en.maintenance_type_id);
    body.append("village_id", formData.en.village);
    body.append("location", formData.en.location);
    body.append("phone", formData.en.phone);
    body.append("status", formData.en.status === "active" ? "1" : "0");
    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time; // لو HH:mm زود :00
    };

    body.append("open_from", formatTimeWithSeconds(formData.en.open_from));
    body.append("open_to", formatTimeWithSeconds(formData.en.open_to));

    if (formData.en.image) {
      body.append("image", formData.en.image);
    }
    if (formData.ar.name) {
      body.append("ar_name", formData.ar.name);
    }
    if (formData.ar.description) {
      body.append("ar_description", formData.ar.description);
    }

    console.log(
      "Submitting form with data:",
      Object.fromEntries(body.entries())
    );
    navigate("/service-provider");

    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/service_provider/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        toast.success("Service provider added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          en: {
            name: "",
            description: "",
            maintenance_type_id: "",
            phone: "",
            location: "",
            status: "",
            village: "",
            image: null,
            open_from: "",
            open_to: "",
          },
          ar: {
            name: "",
            description: "",
          },
        });
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Failed to add service provider.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error submitting service provider:", error);
      toast.error("An error occurred!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  // Combine English and Arabic fields into a single array
  const fields = [
    {
      type: "input",
      placeholder: "Service Provider Name",
      name: "name",
      lang: "en",
    },
    {
      type: "input",
      placeholder: "Description",
      name: "description",
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Maintenance Name",
      name: "maintenance_type_id",
      options: maintenances,
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Village",
      name: "village",
      options: village,
      lang: "en",
    },
    { type: "input", placeholder: "Phone", name: "phone", lang: "en" },
    { type: "time", placeholder: "Open From", name: "open_from", lang: "en" },
    { type: "time", placeholder: "Open To", name: "open_to", lang: "en" },
    { type: "file", name: "image", lang: "en" },
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
      placeholder: "  (اختياري) اسم مزود الخدمة",
      name: "name",
      lang: "ar",
    },
    {
      type: "input",
      placeholder: " (اختياري) الوصف",
      name: "description",
      lang: "ar",
    },
    { type: "map", placeholder: "Location", name: "location", lang: "en" },
  ];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Service Provider
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
