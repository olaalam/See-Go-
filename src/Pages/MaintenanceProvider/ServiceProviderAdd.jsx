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
  const navigate = useNavigate();

  const [village, setVillage] = useState([]);
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

  const [pickUpData, setPickUpData] = useState({
    location_map: "",
    lat: 31.2001,
    lng: 29.9187,
  });

  useEffect(() => {
    const fetchServiceProvider = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/service_provider", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.maintenance_types) {
          setMaintenances(
            data.maintenance_types.map((m) => ({
              label: m.name,
              value: m.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching maintenance types", error);
        toast.error("Failed to fetch maintenance types.");
      }
    };

    fetchServiceProvider();
  }, []);

  useEffect(() => {
    const fetchVillage = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/village", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.villages) {
          setVillage(
            data.villages.map((v) => ({
              label: v.name,
              value: v.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching villages", error);
        toast.error("Failed to fetch villages.");
      }
    };

    fetchVillage();
  }, []);

  const handleFieldChange = (lang, name, value) => {
    if (name === "image" && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [lang]: {
            ...prev[lang],
            [name]: reader.result, // Store Base64 string
          },
        }));
      };
      reader.onerror = (error) => {
        console.error("Error converting image to Base64:", error);
        toast.error("Failed to process image.");
      };
      reader.readAsDataURL(value); // Read file as Data URL (Base64)
    } else if (name === "location") {
      // Handle map location changes
      if (typeof value === "object" && value.lat && value.lng) {
        setPickUpData({
          location_map: value.location_map || `${value.lat},${value.lng}`,
          lat: value.lat,
          lng: value.lng,
        });
      }
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [name]: `${value.lat || pickUpData.lat},${value.lng || pickUpData.lng}`,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [name]: value,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const formatTimeWithSeconds = (time) => {
      return time?.length === 5 ? `${time}:00` : time || "";
    };

    const payload = {
      name: formData.en.name,
      description: formData.en.description,
      maintenance_type_id: formData.en.maintenance_type_id,
      village_id: formData.en.village,
      lat: pickUpData.lat,
      lng: pickUpData.lng,
      location_map: pickUpData.location_map || `${pickUpData.lat},${pickUpData.lng}`,
      location: `${pickUpData.lat},${pickUpData.lng}`,
      phone: formData.en.phone,
      status: formData.en.status === "active" ? "1" : "0",
      open_from: formatTimeWithSeconds(formData.en.open_from),
      open_to: formatTimeWithSeconds(formData.en.open_to),
      image: formData.en.image, // base64 string
      ar_name: formData.ar.name,
      ar_description: formData.ar.description,
    };

    console.log("Submitting form with data:", payload);
    console.log("PickUp Data:", pickUpData);

    // Validation check
    if (!pickUpData.location_map && (!pickUpData.lat || !pickUpData.lng)) {
      toast.error("Please select a location on the map.");
      dispatch(hideLoader());
      return;
    }

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/service_provider/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
        setPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });

        setTimeout(() => {
          navigate("/maintenance-provider");
        }, 2000);
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

  const fields = [
    { type: "input", placeholder: "Service Provider Name", name: "name", lang: "en" },
    { type: "input", placeholder: "Description", name: "description", lang: "en" },
    { type: "select", placeholder: "Maintenance Name", name: "maintenance_type_id", options: maintenances, lang: "en" },
    { type: "select", placeholder: "Village", name: "village", options: village, lang: "en" },
    { type: "input", placeholder: "Phone", name: "phone", lang: "en" },
    { type: "time", placeholder: "Open From", name: "open_from", lang: "en" },
    { type: "time", placeholder: "Open To", name: "open_to", lang: "en" },
    { type: "file", name: "image", lang: "en" },
    { type: "map", placeholder: "Location", name: "location", lang: "en" },
    { type: "input", placeholder: "(اختياري) اسم مزود الخدمة", name: "name", lang: "ar" },
    { type: "input", placeholder: "(اختياري) الوصف", name: "description", lang: "ar" },
    {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "binary",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      lang: "en",
    },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Maintenance Provider
      </h2>

      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={{ en: formData.en, ar: formData.ar }} onChange={handleFieldChange} />
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