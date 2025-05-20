import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddService() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("image", formData.en.image);
    body.append("ar_name", formData.ar.name);
    body.append("ar_description", formData.ar.description);

    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/service_type/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      if (response.ok) {
        toast.success("Service added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          en: { name: "", description: "", status: "", image: null },
          ar: { name: "", description: "", status: "", image: null },
        });
        navigate("/services");
      } else {
        toast.error("Failed to add Service.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error submitting Service:", error);
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
    { type: "input", placeholder: "Service Name", name: "name", lang: "en" },
    {
      type: "select",
      placeholder: "Status",
      name: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      lang: "en",
    },
    { type: "file", name: "image", lang: "en" },
        { type: "input", placeholder: " (اختياري) اسم الخدمة ", name: "name", lang: "ar" }, 

  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Services
      </h2>

      <div className="w-[90%] mx-auto">
        {/* Pass all fields to a single Add component */}
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