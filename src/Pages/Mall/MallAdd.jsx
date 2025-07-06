import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import PickUpMap from "@/components/PickUpMap";

export default function MallAdd() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Store all villages fetched from API
  const [allVillages, setAllVillages] = useState([]);
  const [services, setServices] = useState([]);
  const [zones, setZones] = useState([]);
  // State for villages filtered by selected zone
  const [filteredVillages, setFilteredVillages] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      zone: "",    // Stores the ID of the selected zone
      // location: "",
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
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/mall", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        // Populate Services
        if (data.services_types) {
          setServices(
            data.services_types.map((service) => ({
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

      } catch (error) {
        console.error("Error fetching data for dropdowns:", error);
        toast.error("Failed to load dropdown options.",error);
      }
    };

    fetchDataForDropdowns();
  }, [token]);

  // Effect to filter villages whenever allVillages or selected zone changes
  useEffect(() => {
    if (formData.en.zone && allVillages.length > 0) {
      const villagesInSelectedZone = allVillages.filter(
        (village) => village.zone_id === formData.en.zone
      );
      setFilteredVillages(villagesInSelectedZone);
      // If the currently selected village is no longer in the filtered list, reset it

    } else {
      // If no zone is selected, or no villages are loaded, clear filtered villages
      setFilteredVillages([]);
      setFormData(prev => ({
        ...prev,
        en: { ...prev.en, village: "" }
      }));
    }
  }, [formData.en.zone, allVillages]);


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
        toast.error("Failed to process image.", error);
      };
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
    body.append("name", formData.en.name);
    body.append("description", formData.en.description);
    body.append("location", `${pickUpData.lat},${pickUpData.lng}`);
    body.append("lat", pickUpData.lat.toString());
    body.append("lng", pickUpData.lng.toString());
    body.append("location_map", pickUpData.location_map); // Ensure this matches the backend
    body.append("zone_id", formData.en.zone); // Ensure this matches the backend expectation


    body.append("status", formData.en.status === "active" ? "1" : "0");

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
        "https://bcknd.sea-go.org/admin/mall/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        toast.success("mall added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Reset form data after successful submission
        setFormData({
          en: {
            name: "",
            description: "",
            // location: "",
            status: "",
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
              setPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });
      setTimeout(() => {
 navigate("/mall");      }, 2000);
        // Navigate after successful submission and state reset
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
      toast.error("An error occurred!",error, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  const fields = [
    { type: "input", placeholder: "mall Name", name: "name", lang: "en" },
    {
      type: "input",
      placeholder: "Description",
      name: "description",
      lang: "en",
    },
    
    {
      type: "select",
      placeholder: "Zone",
      name: "zone", // Matches formData key
      options: zones,
      lang: "en",
    },
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
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Mall
      </h2>

      <div className="w-[90%] mx-auto">
        <Add
          fields={fields}
          values={{ en: formData.en, ar: formData.ar }}
          onChange={handleFieldChange}
        />
                <div className="!mt-6 !ms-4">
          <label className="block text-sm font-medium text-gray-700  !mb-2">
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