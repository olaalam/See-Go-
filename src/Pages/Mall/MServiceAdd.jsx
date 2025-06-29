import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input"; // Assuming you might use Input for location_map
import PickUpMap from "@/components/PickUpMap"; // Assuming you use PickUpMap for location

export default function AddProvider() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { id } = useParams(); // Keep id for potential mall_id on submission if needed

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
      zone: "", // Changed from zone_id to zone
      village: "", // Changed from village_id to village
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
    const fetchDataForDropdowns = async () => {
      dispatch(showLoader());
      try {
        // Updated API endpoint to /admin/provider to match the second code block
        const response = await fetch(
          `https://bcknd.sea-go.org/admin/provider`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
        const data = await response.json();

        // Mapping services
        if (data.services_types) { // Note: Changed from service_type to services_types
          setServices(
            data.services_types.map((service) => ({
              label: service.name,
              value: service.id.toString(),
            }))
          );
        }

        // Mapping zones
        if (data.zones) {
          setZones(
            data.zones.map((zone) => ({
              label: zone.name,
              value: zone.id.toString(),
            }))
          );
        }

        // Mapping villages
        if (data.villages) {
          setAllVillages(
            data.villages.map((village) => ({
              label: village.name,
              value: village.id.toString(),
              zone_id: village.zone_id?.toString() || null,
            }))
          );
        }
      } catch (error) {
        console.error("Dropdown fetch error:", error);
        toast.error("Failed to load dropdown options.");
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchDataForDropdowns();
  }, [token, dispatch]); // Removed 'id' from dependency array as it's not used for this fetch

  useEffect(() => {
    // Adjusted to use formData.en.zone
    const selectedZoneId = formData.en.zone;
    if (selectedZoneId && allVillages.length > 0) {
      const filtered = allVillages.filter((v) => v.zone_id === selectedZoneId);
      setFilteredVillages(filtered);

      // Reset village if the current one is not in the filtered list
      if (!filtered.some((v) => v.value === formData.en.village)) {
        setFormData((prev) => ({
          ...prev,
          en: { ...prev.en, village: "" }, // Changed from village_id to village
        }));
      }
    } else {
      setFilteredVillages([]);
      setFormData((prev) => ({
        ...prev,
        en: { ...prev.en, village: "" }, // Changed from village_id to village
      }));
    }
  }, [formData.en.zone, allVillages]); // Adjusted to use formData.en.zone

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
      reader.onerror = () => toast.error("Failed to process image.");
      reader.readAsDataURL(value); // Read file as Data URL (Base64)
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

    const body = new FormData();
    const { en, ar } = formData;

    body.append("name", en.name);
    body.append("description", en.description);
    body.append("service_id", en.service_id);
    body.append("zone_id", en.zone); // Changed from en.zone_id to en.zone
    body.append("village_id", en.village); // Changed from en.village_id to en.village
    body.append("phone", en.phone);
    body.append("location", `${pickUpData.lat},${pickUpData.lng}`);
    body.append("location_map", pickUpData.location_map);
    body.append("status", en.status === "active" ? "1" : "0");
    body.append("mall_id", id); // Retained for now as it was in original code

    // Format time with seconds, consistent with the second code block
    const formatTime = (time) => (time?.length === 5 ? `${time}:00` : time);
    body.append("open_from", formatTime(en.open_from));
    body.append("open_to", formatTime(en.open_to));

    // Append the Base64 string directly
    if (en.image) {
      body.append("image", en.image);
    }
    if (ar.name) body.append("ar_name", ar.name);
    if (ar.description) body.append("ar_description", ar.description);

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/provider/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Provider added successfully!");

        // Reset form data after successful submission
        setFormData({
          en: {
            name: "",
            description: "",
            phone: "",
            service_id: "",
            zone: "",
            village: "",
            status: "",
            image: null,
            open_from: "",
            open_to: "",
          },
          ar: { name: "", description: "" },
        });
        setPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });

        // Navigate after a delay, similar to the second code block
        setTimeout(() => {
          if (result?.provider?.id) {
            navigate(`/mall/single-page-m/${result.provider.id}`); // This path might need adjustment based on your routing
          } else {
            navigate("/mall"); // Default navigation if provider ID isn't returned
          }
        }, 2000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData?.errors
          ? Object.values(errorData.errors).flat().join(", ")
          : errorData?.message || "Failed to add provider.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An error occurred!");
    } finally {
      dispatch(hideLoader());
    }
  };

  const fields = [
    { type: "input", placeholder: "Provider Name", name: "name", lang: "en" },
    { type: "input", placeholder: "Description", name: "description", lang: "en" },
    { type: "select", placeholder: "Service Type", name: "service_id", options: services, lang: "en" },
    { type: "select", placeholder: "Zone", name: "zone", options: zones, lang: "en" }, // Changed name to 'zone'
    { type: "select", placeholder: "Village", name: "village", options: filteredVillages, lang: "en" }, // Changed name to 'village'
    { type: "input", placeholder: "Phone", name: "phone", lang: "en" },
    { type: "time", placeholder: "Open From", name: "open_from", lang: "en" },
    { type: "time", placeholder: "Open To", name: "open_to", lang: "en" },
    { type: "file", name: "image", lang: "en" },
    { type: "switch", name: "status", placeholder: "Status", returnType: "binary", activeLabel: "Active", inactiveLabel: "Inactive", lang: "en" },
    { type: "input", placeholder: " (اختياري) الوصف", name: "description", lang: "ar" },
    { type: "input", placeholder: " (اختياري) اسم المزود ", name: "name", lang: "ar" },
    // Removed the 'map' type from here as it's handled separately below with PickUpMap
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Service Provider
      </h2>
      <div className="w-[90%] mx-auto">
        <Add fields={fields} values={{ en: formData.en, ar: formData.ar }} onChange={handleFieldChange} />

        {/* Add PickUpMap section, similar to the second code block */}
        <div className="!mt-6">
          <label className="block text-sm font-medium text-gray-700 !mb-2">
            Pick-up Location (Google Maps link or address)
          </label>
          <Input
            type="text"
            placeholder="Paste Google Maps link or write address"
            value={pickUpData.location_map}
            onChange={(e) =>
              setPickUpData((prev) => ({
                ...prev,
                location_map: e.target.value,
              }))
            }
            className="!mb-4 !ps-2"
          />
          <PickUpMap tourPickUp={pickUpData} setTourPickUp={setPickUpData} />
        </div>
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