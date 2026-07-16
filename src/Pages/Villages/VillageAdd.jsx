"use client";
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
import { Plus, Trash2 } from "lucide-react"; 

export default function AddVillage() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [zoneOptions, setZoneOptions] = useState([]);
  const [villageZones, setVillageZones] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      zone: "",
      status: "",
      image: null,
      units_num: "",
      logo: null, 
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
          setZoneOptions(
            data.zones.map((zone) => ({
              label: zone.name,
              value: zone.id.toString(),
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching zones", error);
        toast.error("Error fetching zones");
      }
    };

    fetchZones();
  }, []);

  const handleZoneChange = (index, field, lang, value) => {
    setVillageZones((prev) => {
      const updated = [...prev];
      if (lang) {
        updated[index][field] = {
          ...updated[index][field],
          [lang]: value,
        };
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  // 🌟 دالة تحديث الإحداثيات عند تحريك الدبوس على خريطة المنطقة المحددة
  const handleZoneMapChange = (index, nextState) => {
    setVillageZones((prev) => {
      const updated = [...prev];
      const current = {
        lat: Number(prev[index].lat) || 31.2001,
        lng: Number(prev[index].lng) || 29.9187,
        location_map: ""
      };
      // معالجة إذا كانت الـ state ترسل كـ callback function أو كـ object مباشر
      const next = typeof nextState === "function" ? nextState(current) : nextState;
      
      updated[index].lat = next.lat.toString();
      updated[index].lng = next.lng.toString();
      return updated;
    });
  };

  const addZoneField = () => {
    setVillageZones((prev) => [
      ...prev,
      {
        name: { en: "", ar: "" },
        description: { en: "", ar: "" },
        lat: "31.2001", // إحداثيات افتراضية لتفادي الأخطاء في رندر الخريطة لأول مرة
        lng: "29.9187",
      },
    ]);
  };

  const removeZoneField = (index) => {
    setVillageZones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (lang, name, value) => {
    if ((name === "image" || name === "logo") && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [lang]: {
            ...prev[lang],
            [name]: reader.result,
          },
        }));
      };
      reader.onerror = (error) => {
        console.error("Error converting image to Base64:", error);
        toast.error("Failed to process image.");
      };
      reader.readAsDataURL(value);
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

    const formattedZones = villageZones.map((z) => ({
      name: {
        en: z.name.en,
        ar: z.name.ar,
      },
      description: {
        en: z.description.en,
        ar: z.description.ar,
      },
      lat: z.lat ? Number(z.lat) : 0,
      lng: z.lng ? Number(z.lng) : 0,
    }));

    const payload = {
      name: formData.en.name,
      description: formData.en.description,
      zone_id: formData.en.zone,
      units_num: formData.en.units_num ? Number(formData.en.units_num) : 0,
      lat: pickUpData.lat.toString(),
      lng: pickUpData.lng.toString(),
      location_map: pickUpData.location_map,
      location: `${pickUpData.lat},${pickUpData.lng}`,
      status: formData.en.status === "active" ? "1" : "0",
      image: formData.en.image,
      ar_name: formData.ar.name,
      ar_description: formData.ar.description,
      logo: formData.en.logo,
      zones: formattedZones,
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
        },
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
            status: "",
            image: null,
            units_num: "",
            logo: "",
          },
          ar: {
            name: "",
            description: "",
          },
        });
        setPickUpData({ location_map: "", lat: 31.2001, lng: 29.9187 });
        setVillageZones([]);
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
      options: zoneOptions,
      lang: "en",
    },
    {
      type: "input",
      placeholder: "Limit of Units",
      name: "units_num",
      lang: "en",
    }, 
    { type: "file", placeholder: "Village Image", name: "image", lang: "en" },
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
    { type: "file", placeholder: "Village Logo", name: "logo", lang: "en" },
  ];

  return (
    <div className="w-full !p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Village
      </h2>

      <div className="w-[90%] !mx-auto">
        <Add
          fields={fields}
          values={{ en: formData.en, ar: formData.ar }}
          onChange={handleFieldChange}
        />
        
        {/* قسم المناطق (Zones) التفاعلي مع الخرائط */}
        <div className="!mt-8 !ms-3 border-t !pt-6 border-gray-100">
          <div className="flex justify-between items-center !mb-4">
            <h3 className="text-md font-semibold text-bg-primary">Village Zones (المناطق التابعة للقرية)</h3>
            <Button
              type="button"
              onClick={addZoneField}
              className="bg-bg-primary hover:bg-teal-600 text-white flex items-center gap-1 text-xs cursor-pointer rounded-[10px]"
            >
              <Plus className="w-4 h-4" /> Add Zone
            </Button>
          </div>

          {villageZones.length === 0 ? (
            <p className="text-xs text-gray-400 !mb-4 italic">No zones added yet. Click "Add Zone" if you want to include zones.</p>
          ) : (
            <div className="space-y-4">
              {villageZones.map((zone, index) => (
                <div key={index} className="bg-[#fcfdfd] !p-4 rounded-[15px] border border-teal-50 relative group">
                  <button
                    type="button"
                    onClick={() => removeZoneField(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors !p-1"
                    title="Remove Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Zone Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 !mb-1">Zone Name (EN)</label>
                      <Input
                        type="text"
                        placeholder="e.g. Zone A"
                        value={zone.name.en}
                        onChange={(e) => handleZoneChange(index, "name", "en", e.target.value)}
                        className="!ps-2 border-gray-200 focus:border-bg-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 !mb-1 text-right">اسم المنطقة (AR)</label>
                      <Input
                        type="text"
                        placeholder="مثال: منطقة أ"
                        value={zone.name.ar}
                        onChange={(e) => handleZoneChange(index, "name", "ar", e.target.value)}
                        className="!ps-2 text-right border-gray-200 focus:border-bg-primary"
                      />
                    </div>

                    {/* Zone Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 !mb-1">Zone Description (EN)</label>
                      <Input
                        type="text"
                        placeholder="e.g. Near Main Gate"
                        value={zone.description.en}
                        onChange={(e) => handleZoneChange(index, "description", "en", e.target.value)}
                        className="!ps-2 border-gray-200 focus:border-bg-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 !mb-1 text-right">وصف المنطقة (AR)</label>
                      <Input
                        type="text"
                        placeholder="مثال: بالقرب من البوابة الرئيسية"
                        value={zone.description.ar}
                        onChange={(e) => handleZoneChange(index, "description", "ar", e.target.value)}
                        className="!ps-2 text-right border-gray-200 focus:border-bg-primary"
                      />
                    </div>

                    {/* Lat & Lng Inputs */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 !mb-1">Latitude (Lat)</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="31.2001"
                        value={zone.lat}
                        onChange={(e) => handleZoneChange(index, "lat", null, e.target.value)}
                        className="!ps-2 border-gray-200 focus:border-bg-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 !mb-1">Longitude (Lng)</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="29.9187"
                        value={zone.lng}
                        onChange={(e) => handleZoneChange(index, "lng", null, e.target.value)}
                        className="!ps-2 border-gray-200 focus:border-bg-primary"
                      />
                    </div>

                    {/* 🌟 خريطة تحديد موقع المنطقة (Zone Map picker) */}
                    <div className="!mt-4 col-span-1 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-400 !mb-2">
                        Pick Zone Location on Map (اختر موقع المنطقة من الخريطة)
                      </label>
                      <PickUpMap 
                        tourPickUp={{
                          lat: Number(zone.lat) || 31.2001,
                          lng: Number(zone.lng) || 29.9187,
                          location_map: ""
                        }}
                        setTourPickUp={(nextState) => handleZoneMapChange(index, nextState)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* خريطة القرية الأساسية (Pick-up Location) */}
        <div className="!mt-6 !ms-3">
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