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

export default function AddVillage() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      zone: "",
      // location: "",
      status: "",
      image: null,
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
    const fetchZones = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/zone", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.zones) {
          setZones(
            data.zones.map((zone) => ({
              label: zone.name,
              value: zone.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching zones", error);
        toast.error("Error fetching zones", error);
      }
    };

    fetchZones();
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
        toast.error("Failed to process image.",error);
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

  const payload = {
    name: formData.en.name,
    description: formData.en.description,
    zone_id: formData.en.zone,
    lat: pickUpData.lat.toString(),
    lng: pickUpData.lng.toString(),
    location_map: pickUpData.location_map,
    location: `${pickUpData.lat},${pickUpData.lng}`,
    status: formData.en.status === "active" ? "1" : "0",
    image: formData.en.image, // base64 string
    ar_name: formData.ar.name,
    ar_description: formData.ar.description,
  };

  try {
    const response = await fetch(
      "https://bcknd.sea-go.org/admin/village/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      toast.success("Village added successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      setFormData({
        en: {
          name: "",
          description: "",
          zone: "",
          // location: "",
          status: "",
          image: null,
        },
        ar: {
          name: "",
          description: "",
        },
      });
      setPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });
      setTimeout(() => {
        navigate("/villages");
      }, 2000);
    } else {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      toast.error(errorData.message || "Failed to add Village.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  } catch (error) {
    console.error("Error submitting Village:", error);
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
    { type: "input", placeholder: "Village Name", name: "name", lang: "en" },
    {
      type: "input",
      placeholder: "Description",
      name: "description",
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Zone",
      name: "zone",
      options: zones,
      lang: "en",
    },

    { type: "file", name: "image", lang: "en" },
    {
      type: "input",
      placeholder: " (اختياري) الوصف",
      name: "description",
      lang: "ar",
    },
    {
      type: "input",
      placeholder: "اسم القرية (اختياري)",
      name: "name",
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
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Village
      </h2>

      <div className="w-[90%] mx-auto">
        {/* Pass all fields to a single Add component */}
        <Add
          fields={fields}
          values={{ en: formData.en, ar: formData.ar }}
          onChange={handleFieldChange}
        />
                <div className="!mt-6 !ms-3">
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
