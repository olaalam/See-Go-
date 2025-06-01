import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate, useParams } from "react-router-dom";

export default function AddProvider() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  // Corrected destructuring for useParams
  const { id } = useParams(); // <-- Corrected this line

  // State to store all villages fetched from the API
  const [allVillages, setAllVillages] = useState([]);
  const [services, setServices] = useState([]);
  const [zones, setZones] = useState([]);
  // State for villages filtered by the selected zone
  const [filteredVillages, setFilteredVillages] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      phone: "",
      service_id: "",
      zone_id: "", // Renamed to zone_id for clarity and consistency with backend
      village_id: "", // Added to store the selected village ID
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

  // Effect to fetch initial data for dropdowns (services, zones, and all villages)
  useEffect(() => {
    const fetchDataForDropdowns = async () => {
      dispatch(showLoader()); // Show loader before fetching
      try {
        // Changed API endpoint for fetching dropdown data
        // It was previously hitting /admin/provider/add which is for POST, not GET for options.
        // Assuming /admin/mall/providers?mall_id=${id} provides the necessary dropdown data,
        // if not, you might need a different endpoint that returns all services, zones, and villages.
        const response = await fetch(`https://bcknd.sea-go.org/admin/mall/providers?mall_id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Populate Services
        if (data.service_type) {
          setServices(
            data.service_type.map((service) => ({
              label: service.name,
              value: service.id.toString(),
            }))
          );
        }

        // Populate Zones
        if (data.zones) {
          setZones(
            data.zones.map((zone) => ({
              label: zone.name,
              value: zone.id.toString(),
            }))
          );
        }

        // Populate ALL Villages and store them
        if (data.villages) {
          setAllVillages(
            data.villages.map((village) => ({
              label: village.name,
              value: village.id.toString(),
              zone_id: village.zone_id ? village.zone_id.toString() : null, // Ensure village object has zone_id
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data for dropdowns:", error);
        toast.error("Failed to load dropdown options.");
      } finally {
        dispatch(hideLoader()); // Hide loader after fetching (success or error)
      }
    };

    fetchDataForDropdowns();
  }, [token, dispatch, id]); // Added 'id' to dependency array since it's used in the fetch URL

  // Effect to filter villages whenever allVillages or the selected zone_id changes
  useEffect(() => {
    const selectedZoneId = formData.en.zone_id;
    if (selectedZoneId && allVillages.length > 0) {
      const villagesInSelectedZone = allVillages.filter(
        (village) => village.zone_id === selectedZoneId
      );
      setFilteredVillages(villagesInSelectedZone);

      // If the currently selected village_id is no longer in the filtered list, reset it
      if (!villagesInSelectedZone.some((v) => v.value === formData.en.village_id)) {
        setFormData((prev) => ({
          ...prev,
          en: { ...prev.en, village_id: "" },
        }));
      }
    } else {
      // If no zone is selected, or no villages are loaded, clear filtered villages
      setFilteredVillages([]);
      setFormData((prev) => ({
        ...prev,
        en: { ...prev.en, village_id: "" },
      }));
    }
  }, [formData.en.zone_id, allVillages]);

  const handleFieldChange = (lang, name, value) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [lang]: {
          ...prev[lang],
          [name]: value,
        },
      };

      // If the changed field is 'zone_id', reset 'village_id'
      if (lang === "en" && name === "zone_id") {
        newFormData.en.village_id = ""; // Reset village_id when zone changes
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
    body.append("location", formData.en.location);
    body.append("zone_id", formData.en.zone_id); // Using zone_id

    body.append("phone", formData.en.phone);
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("mall_id", id); // Appending mall_id from params for provider creation

    const formatTimeWithSeconds = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time; // If HH:mm, add :00
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

    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/provider/add", // Still sending to this endpoint
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        const result = await response.json(); // Assuming the backend returns some data on success, e.g., the ID of the new provider
        toast.success("Provider added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Reset form data after successful submission
        setFormData({
          en: {
            name: "",
            description: "",
            service_id: "",
            phone: "",
            location: "",
            status: "",
            zone_id: "",
            image: null,
            open_from: "",
            open_to: "",
          },
          ar: {
            name: "",
            description: "",
          },
        });
        // Navigate to the single provider page if ID is available
        if (result?.provider?.id) {
          navigate(`/mall/single-page-m/${result.provider.id}`);
        } else {
          // Fallback navigation or message if no ID is returned
          navigate("/mall"); // Or a list page
        }
      } else {
        let errorMessage = "Failed to add provider.";
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
      console.error("Error submitting provider:", error);
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
    {
      type: "input",
      placeholder: "Description",
      name: "description",
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Service Type",
      name: "service_id",
      options: services,
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Zone",
      name: "zone_id", // Updated to zone_id
      options: zones,
      lang: "en",
    },

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
    {
      type: "input",
      placeholder: " (اختياري) الوصف",
      name: "description",
      lang: "ar",
    },
    {
      type: "input",
      placeholder: " (اختياري) اسم المزود ",
      name: "name",
      lang: "ar",
    },
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