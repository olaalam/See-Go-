import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading"; 

export default function AddZone() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading); 

  const [formData, setFormData] = useState({
    en: { name: "", description: "", status: "", image: null },
    ar: { name: "", description: "", status: "", image: null },
  });

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
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("image", formData.en.image);
    body.append("ar_name", formData.ar.name);
    body.append("ar_description", formData.ar.description);

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/zone/add", {
        method: "POST",
        headers: {
          Authorization: "Bearer 1|lT28bSsFeyAMSLJGnHcIYMDekPJRx3M1T6ROsQlmf0208b31",
        },
        body,
      });

      if (response.ok) {
        toast.success("Zone added successfully!", { position: "top-right", autoClose: 3000 });
        setFormData({
          en: { name: "", description: "", status: "", image: null },
          ar: { name: "", description: "", status: "", image: null },
        });
      } else {
        toast.error("Failed to add zone.", { position: "top-right", autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error submitting zone:", error);
      toast.error("An error occurred!", { position: "top-right", autoClose: 3000 });
    } finally {
      dispatch(hideLoader());
    }
  };

  const fieldsEn = [
    { type: "input", placeholder: "Zone Name", name: "name" },
    { type: "input", placeholder: "Description", name: "description" },
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
    { type: "file", name: "image" },
    {
      type: "select",
      placeholder: "الحالة",
      name: "status",
      options: [
        { value: "active", label: "نشط" },
        { value: "inactive", label: "غير نشط" },
      ],
    },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Zones
      </h2>

      <Tabs defaultValue="english" className="w-full ">
        <TabsList className="grid w-[50%] !ms-3 grid-cols-2 gap-4 bg-transparent !mb-6">
          <TabsTrigger value="english"             className="rounded-[10px] border text-bg-primary py-2 transition-all 
              data-[state=active]:bg-bg-primary data-[state=active]:text-white 
              hover:bg-teal-100 hover:text-teal-700">English</TabsTrigger>
          <TabsTrigger value="arabic"             className="rounded-[10px] border text-bg-primary py-2 transition-all 
              data-[state=active]:bg-bg-primary data-[state=active]:text-white 
              hover:bg-teal-100 hover:text-teal-700">Arabic</TabsTrigger>
        </TabsList>

        <TabsContent value="english">
          <Add fields={fieldsEn} lang="en" values={formData.en} onChange={handleFieldChange} />
        </TabsContent>
        <TabsContent value="arabic">
          <Add fields={fieldsAr} lang="ar" values={formData.ar} onChange={handleFieldChange} />
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
