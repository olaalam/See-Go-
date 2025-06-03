import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddProvider() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [allVillages, setAllVillages] = useState([]);
  const [services, setServices] = useState([]);
  const [zones, setZones] = useState([]);
  const [filteredVillages, setFilteredVillages] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      phone: "",
      service_id: "",
      village: "",
      zone: "",
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
    const fetchDataForDropdowns = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/provider", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.services_types) {
          setServices(
            data.services_types.map((service) => ({
              label: service.name,
              value: service.id.toString(),
            }))
          );
        }

        if (data.zones) {
          setZones(
            data.zones.map((zone) => ({
              label: zone.name,
              value: zone.id.toString(),
            }))
          );
        }

        if (data.villages) {
          setAllVillages(
            data.villages.map((village) => ({
              label: village.name,
              value: village.id.toString(),
              zone_id: village.zone_id ? village.zone_id.toString() : null,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data for dropdowns:", error);
        toast.error("Failed to load dropdown options.");
      }
    };

    fetchDataForDropdowns();
  }, [token]);

  useEffect(() => {
    if (formData.en.zone && allVillages.length > 0) {
      const villagesInSelectedZone = allVillages.filter(
        (village) => village.zone_id === formData.en.zone
      );
      setFilteredVillages(villagesInSelectedZone);
      if (!villagesInSelectedZone.some(v => v.value === formData.en.village)) {
        setFormData(prev => ({
          ...prev,
          en: { ...prev.en, village: "" }
        }));
      }
    } else {
      setFilteredVillages([]);
      setFormData(prev => ({
        ...prev,
        en: { ...prev.en, village: "" }
      }));
    }
  }, [formData.en.zone, allVillages]);

  const handleFieldChange = (lang, name, value) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [lang]: {
          ...prev[lang],
          [name]: value,
        },
      };
      if (lang === 'en' && name === 'zone') {
        newFormData.en.village = "";
      }
      return newFormData;
    });
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.en.name);
    body.append("description", formData.en.description);
    body.append("service_id", formData.en.service_id);
    body.append("village_id", formData.en.village);
    body.append("location", formData.en.location);
    body.append("zone_id", formData.en.zone);
    body.append("phone", formData.en.phone);
    body.append("status", formData.en.status === "active" ? "1" : "0");

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
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

    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/provider/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        toast.success("Provider added successfully!", {
          position: "top-right",
          autoClose: 2000,
        });

        setTimeout(() => {
          setFormData({
            en: {
              name: "",
              description: "",
              service_id: "",
              phone: "",
              location: "",
              status: "",
              village: "",
              zone: "",
              image: null,
              open_from: "",
              open_to: "",
            },
            ar: {
              name: "",
              description: "",
            },
          });
          navigate("/providers");
        }, 2000);
      } else {
        let errorMessage = "Failed to add subscriber.";
        try {
          const errorData = await response.json();
          if (errorData?.errors && typeof errorData.errors === "object") {
            errorMessage = Object.values(errorData.errors)
              .flat()
              .join(", ");
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

  const fields = [
    { type: "input", placeholder: "Provider Name", name: "name", lang: "en" },
    { type: "input", placeholder: "Description", name: "description", lang: "en" },
    { type: "select", placeholder: "Service Type", name: "service_id", options: services, lang: "en" },
    { type: "select", placeholder: "Zone", name: "zone", options: zones, lang: "en" },
    { type: "select", placeholder: "Village (Optional)", name: "village", options: filteredVillages, lang: "en" },
    { type: "input", placeholder: "Phone", name: "phone", lang: "en" },
    { type: "time", placeholder: "Open From", name: "open_from", lang: "en" },
    { type: "time", placeholder: "Open To", name: "open_to", lang: "en" },
    { type: "file", name: "image", lang: "en" },
    {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "binary",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      lang: "en",
    },
    { type: "input", placeholder: " (اختياري) الوصف", name: "description", lang: "ar" },
    { type: "input", placeholder: " (اختياري) اسم المزود ", name: "name", lang: "ar" },
    { type: "map", placeholder: "Location", name: "location", lang: "en" },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Service Provider
      </h2>

      <div className="w-[90%] mx-auto">
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
