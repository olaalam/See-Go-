import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function Addprovider() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const [village, setVillage] = useState([]);
  const navigate = useNavigate();
  const [services, setservices] = useState([]);

const [formData, setFormData] = useState({
  en: {
    name: "",
    description: "",
    phone: "",
    service_id: "",
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
    const fetchServices = async () => {
      try {
        const response = await fetch(
          "https://bcknd.sea-go.org/admin/service_type",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.service_types) {
          setservices(
            data.service_types.map((service) => ({
              label: service.name,
              value: service.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching services", error);
      }
    };

    fetchServices();
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
    body.append("service_id", formData.en.service);
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
    navigate("/providers")

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
        toast.success("provider added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          en: {
            name: "",
            description: "",
            service_id: "",
            phone: "",
            location: "",
            status: "",
            village: "",
            image: null,
          },
          ar: {
            name: "",
            description: "",
          },
        });
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Failed to add provider.", {
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

const fieldsEn = [
  { type: "input", placeholder: "Provider Name", name: "name" },
  { type: "input", placeholder: "Description", name: "description" },
  { type: "select", placeholder: "service", name: "service", options: services },
  { type: "select", placeholder: "village", name: "village", options: village },
  { type: "input", placeholder: "Location", name: "location" },
  { type: "input", placeholder: "Phone", name: "phone" },
  { type: "time",placeholder:"OPen_From" ,name: "open_from"},
  { type: "time", placeholder:"Open_To",name: "open_to"},
  { type: "file", name: "image" },
  {
    type: "select",
    placeholder: "Status",
    name: "status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];

  const fieldsAr = [
    { type: "input", placeholder: "اسم المنطقة", name: "name" },
    { type: "input", placeholder: "الوصف", name: "description" },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Provider
      </h2>

      <Tabs defaultValue="english" className="w-full">
        <TabsList className="grid  !ms-3 w-[50%] grid-cols-2 gap-4 bg-transparent !mb-6">
          <TabsTrigger
            value="english"
            className="rounded-[10px] border text-bg-primary py-2 transition-all 
              data-[state=active]:bg-bg-primary data-[state=active]:text-white 
              hover:bg-teal-100 hover:text-teal-700"
          >
            English
          </TabsTrigger>
          <TabsTrigger
            value="arabic"
            className="rounded-[10px] border text-bg-primary py-2 transition-all 
              data-[state=active]:bg-bg-primary data-[state=active]:text-white 
              hover:bg-teal-100 hover:text-teal-700"
          >
            Arabic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="english">
          <Add
            fields={fieldsEn}
            lang="en"
            values={formData.en}
            onChange={handleFieldChange}
          />
        </TabsContent>
        <TabsContent value="arabic">
          <Add
            fields={fieldsAr}
            lang="ar"
            values={formData.ar}
            onChange={handleFieldChange}
          />
        </TabsContent>
      </Tabs>

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
