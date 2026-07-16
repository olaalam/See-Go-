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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export default function AddProvider() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [allVillages, setAllVillages] = useState([]);
  const [services, setServices] = useState([]);
  const [zones, setZones] = useState([]);
  const [zonesVillages, setZonesVillages] = useState([]); 
  const [malls, setMalls] = useState([]); 
  const [filteredVillages, setFilteredVillages] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      description: "",
      phone: "",
      service_id: "",
      village: "",
      zone: "",
      zone_village: "", 
      mall: "", 
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

  const [workHours, setWorkHours] = useState([
    { day: "monday", from: "", to: "", is_24_hours: false, is_closed: false },
    { day: "tuesday", from: "", to: "", is_24_hours: false, is_closed: false },
    { day: "wednesday", from: "", to: "", is_24_hours: false, is_closed: false },
    { day: "thursday", from: "", to: "", is_24_hours: false, is_closed: false },
    { day: "friday", from: "", to: "", is_24_hours: false, is_closed: false },
    { day: "saturday", from: "", to: "", is_24_hours: false, is_closed: false },
    { day: "sunday", from: "", to: "", is_24_hours: false, is_closed: false },
  ]);

  const [pickUpData, setPickUpData] = useState({
    location_map: "",
    lat: 31.2001,
    lng: 29.9187,
  });

  useEffect(() => {
    const fetchDataForDropdowns = async () => {
      try {
        const response = await fetch(
          "https://bcknd.sea-go.org/admin/provider/lists",
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

        if (data.zones_village) {
          setZonesVillages(
            data.zones_village.map((zv) => {
              let labelText = "—";
              if (zv.name) {
                if (typeof zv.name === "object") {
                  labelText = zv.name.en || zv.name.ar || "—";
                } else {
                  labelText = zv.name;
                }
              }
              return {
                label: labelText,
                value: zv.id.toString(),
              };
            })
          );
        }

        if (data.malls) {
          setMalls(
            data.malls.map((m) => ({
              label: m.name,
              value: m.id.toString(),
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

  const handleWorkHourChange = (index, field, value) => {
    setWorkHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === "is_24_hours" && value) {
        updated[index].from = "";
        updated[index].to = "";
      }
      
      if (field === "is_closed" && value) {
        updated[index].from = "";
        updated[index].to = "";
        updated[index].is_24_hours = false;
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.en.name);
    body.append("description", formData.en.description);
    body.append("service_id", formData.en.service_id);
    body.append("village_id", formData.en.village);
    body.append("zone_id", formData.en.zone);
    
    if (formData.en.zone_village) {
      body.append("zone_village_id", formData.en.zone_village);
    }
    if (formData.en.mall) {
      body.append("mall_id", formData.en.mall);
    }

    body.append("phone", formData.en.phone);
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("lat", pickUpData.lat.toString());
    body.append("lng", pickUpData.lng.toString());
    body.append("location_map", pickUpData.location_map);
    body.append("location", `${pickUpData.lat},${pickUpData.lng}`);

    // دالة مساعدة لضمان الصيغة H:i:s
    const formatTime = (time) => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
    };

    body.append("open_from", formatTime(formData.en.open_from));
    body.append("open_to", formatTime(formData.en.open_to));

    if (formData.en.image) body.append("image", formData.en.image);
    if (formData.ar.name) body.append("ar_name", formData.ar.name);
    if (formData.ar.description)
      body.append("ar_description", formData.ar.description);

    // تفكيك وحل مشكلة مصفوفة مواعيد العمل للـ FormData مع تعديل صيغة الوقت
    workHours.forEach((hour, index) => {
      body.append(`work_hours[${index}][day]`, hour.day);
      body.append(`work_hours[${index}][from]`, formatTime(hour.from));
      body.append(`work_hours[${index}][to]`, formatTime(hour.to));
      body.append(`work_hours[${index}][is_24_hours]`, hour.is_24_hours ? "1" : "0");
      body.append(`work_hours[${index}][is_closed]`, hour.is_closed ? "1" : "0");
    });

    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/provider/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
              zone_village: "",
              mall: "",
              image: null,
              open_from: "",
              open_to: "",
            },
            ar: {
              name: "", 
              description: ""
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
      toast.error("An error occurred.", { autoClose: 3000 });
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
    {
      type: "select",
      placeholder: "Zone Village (Optional)",
      name: "zone_village",
      options: zonesVillages,
      lang: "en",
    },
    {
      type: "select",
      placeholder: "Mall (Optional)",
      name: "mall",
      options: malls,
      lang: "en",
    },
    { type: "input", placeholder: "Phone", name: "phone", lang: "en" },
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
        
        {/* Work Hours Section */}
        <div className="!mt-8">
          <h3 className="text-lg font-semibold text-bg-primary !mb-4">Work Hours</h3>
          <div className="space-y-4">
            {workHours.map((daySchedule, index) => (
              <Card key={daySchedule.day} className="bg-[#f3fbfa] border-none shadow-sm">
                <CardContent className="!p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <Label className="capitalize font-semibold text-bg-primary">
                        {daySchedule.day}
                      </Label>
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={daySchedule.from}
                        onChange={(e) =>
                          handleWorkHourChange(index, "from", e.target.value)
                        }
                        disabled={daySchedule.is_24_hours || daySchedule.is_closed}
                        className="!ps-2"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="time"
                        value={daySchedule.to}
                        onChange={(e) =>
                          handleWorkHourChange(index, "to", e.target.value)
                        }
                        disabled={daySchedule.is_24_hours || daySchedule.is_closed}
                        className="!ps-2"
                      />
                    </div>

                    <div className="col-span-3 flex items-center gap-2">
                      <Switch
                        checked={daySchedule.is_24_hours}
                        onCheckedChange={(checked) =>
                          handleWorkHourChange(index, "is_24_hours", checked)
                        }
                        disabled={daySchedule.is_closed}
                      />
                      <Label className="text-sm">24 Hours</Label>
                    </div>

                    <div className="col-span-3 flex items-center gap-2">
                      <Switch
                        checked={daySchedule.is_closed}
                        onCheckedChange={(checked) =>
                          handleWorkHourChange(index, "is_closed", checked)
                        }
                      />
                      <Label className="text-sm">Closed</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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