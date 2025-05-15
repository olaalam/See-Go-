import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddPaymentMethod() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    en: { name: "", description: "", status: "", logo: null },
    ar: { name: "", description: "", status: "", logo: null },
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
    // إرسال الحقول الخاصة باللغة الإنجليزية فقط
    if (formData.en.name) {
      body.append("name", formData.en.name);
    }
    if (formData.en.description) {
      body.append("description", formData.en.description);
    }

    // إرسال الحالة
    body.append("status", formData.en.status === "active" ? "1" : "0");

    // إرسال الشعار (الإنجليزي أو العربي)
    if (formData.en.logo) {
      body.append("logo", formData.en.logo); // إرسال الشعار من اللغة الإنجليزية إذا كان موجودًا
    } else if (formData.ar.logo) {
      body.append("logo", formData.ar.logo); // إرسال الشعار من اللغة العربية إذا كان موجودًا
    }

    // إرسال الحقول الخاصة باللغة العربية فقط
    if (formData.ar.name) {
      body.append("ar_name", formData.ar.name);
    }
    if (formData.ar.description) {
      body.append("ar_description", formData.ar.description);
    }

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/payment_method/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (response.ok) {
        toast.success("Payment Method added successfully!", { position: "top-right", autoClose: 3000 });
        setFormData({
          en: { name: "", description: "", status: "", logo: null },
          ar: { name: "", description: "", status: "", logo: null },
        });
        navigate("/payment-methods")
      } else {
        toast.error("Failed to add Payment Method.", { position: "top-right", autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error submitting Payment Method:", error);
      toast.error("An error occurred!", { position: "top-right", autoClose: 3000 });
    } finally {
      dispatch(hideLoader());
    }
  };

  const fieldsEn = [
    { type: "input", placeholder: "Payment Method", name: "name" },
    { type: "input", placeholder: "Description", name: "description" },
    { type: "file", name: "logo" },
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
    { type: "input", placeholder: "طريقة الدفع", name: "name" },
    { type: "input", placeholder: "الوصف", name: "description" },
    { type: "file", name: "logo" },
    {
      type: "select",
      placeholder: "status",
      name: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Payment Methods
      </h2>

      <Tabs defaultValue="english" className="w-full ">
        <TabsList className="grid w-[50%] !ms-3 grid-cols-2 gap-4 bg-transparent !mb-6">
          <TabsTrigger value="english" className="rounded-[10px] border text-bg-primary py-2 transition-all data-[state=active]:bg-bg-primary data-[state=active]:text-white hover:bg-teal-100 hover:text-teal-700">English</TabsTrigger>
          <TabsTrigger value="arabic" className="rounded-[10px] border text-bg-primary py-2 transition-all data-[state=active]:bg-bg-primary data-[state=active]:text-white hover:bg-teal-100 hover:text-teal-700">Arabic</TabsTrigger>
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
