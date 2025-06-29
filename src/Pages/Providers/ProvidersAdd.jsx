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
      status: "",
      image: null, // This will now store the Base64 string or null
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
        const response = await fetch(
          "https://bcknd.sea-go.org/admin/provider",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
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
            data.villages.map((v) => ({
              label: v.name,
              value: v.id.toString(),
              zone_id: v.zone_id?.toString() || null,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data for dropdowns:", error);
        toast.error("Failed to load dropdown options.", error);
      }
    };

    fetchDataForDropdowns();
  }, [token]);

  useEffect(() => {
    if (formData.en.zone && allVillages.length > 0) {
      const villagesInSelectedZone = allVillages.filter(
        (v) => v.zone_id === formData.en.zone
      );
      setFilteredVillages(villagesInSelectedZone);
      if (
        !villagesInSelectedZone.some((v) => v.value === formData.en.village)
      ) {
        setFormData((prev) => ({ ...prev, en: { ...prev.en, village: "" } }));
      }
    } else {
      setFilteredVillages([]);
      setFormData((prev) => ({ ...prev, en: { ...prev.en, village: "" } }));
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
    body.append("service_id", formData.en.service_id);
    body.append("village_id", formData.en.village);
    body.append("zone_id", formData.en.zone);
    body.append("phone", formData.en.phone);
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("lat", pickUpData.lat.toString());
    body.append("lng", pickUpData.lng.toString());
    body.append("location_map", pickUpData.location_map);
    body.append("location", `${pickUpData.lat},${pickUpData.lng}`);

    const formatTime = (time) => (time?.length === 5 ? `${time}:00` : time);
    body.append("open_from", formatTime(formData.en.open_from));
    body.append("open_to", formatTime(formData.en.open_to));

    // Append the Base64 string directly
    if (formData.en.image) body.append("image", formData.en.image);
    if (formData.ar.name) body.append("ar_name", formData.ar.name);
    if (formData.ar.description)
      body.append("ar_description", formData.ar.description);

    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/provider/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // No 'Content-Type' header needed for FormData, browser sets it automatically
        },
        body,
      });

      if (res.ok) {
        toast.success("Provider added successfully!", { autoClose: 2000 });
        setTimeout(() => {
          setFormData({
            en: {
              name: "",
              description: "",
              service_id: "",
              phone: "",
              status: "",
              village: "",
              zone: "",
              image: null,
              open_from: "",
              open_to: "",
            },
            ar: { name: "", description: "" 

            },
          });
          setPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });
          navigate("/providers");
        }, 2000);
      } else {
        const errData = await res.json();
        let msg = errData.message || "Failed to add provider.";
        if (errData.errors)
          msg = Object.values(errData.errors).flat().join(", ");
        toast.error(msg, { autoClose: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.",err, { autoClose: 3000 });
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
      name: "zone",
      options: zones,
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Village (Optional)",
      name: "village",
      options: filteredVillages,
      lang: "en",
    },
    { type: "input", placeholder: "Phone", name: "phone", lang: "en" },
    { type: "time", placeholder: "Open From", name: "open_from", lang: "en" },
    { type: "time", placeholder: "Open To", name: "open_to", lang: "en" },
    { type: "file", name: "image", lang: "en" },
    { type: "switch", name: "status", placeholder: "Status", lang: "en" },
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
        Add Service Provider
      </h2>

      <div className="w-[90%] !ms-4">
        <Add fields={fields} values={formData} onChange={handleFieldChange} />

        <div className="!mt-6">
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
