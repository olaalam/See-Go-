import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddZone() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "",
    image: null,
    ar_name: "",
    ar_description: "",
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.name);
    body.append("description", formData.description);
    body.append("status", formData.status === "active" ? "1" : "0");
    body.append("image", formData.image);
    body.append("ar_name", formData.ar_name);
    body.append("ar_description", formData.ar_description);

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/zone/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (response.ok) {
        toast.success("Zone added successfully!", { position: "top-right", autoClose: 3000 });
        setFormData({
          name: "",
          description: "",
          status: "",
          image: null,
          ar_name: "",
          ar_description: "",
        });
        navigate("/zones");
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

  // Combine English and Arabic fields into a single array
  const fields = [
    {
      type: "input",
      placeholder: "Zone Name (English)",
      name: "name",
    },
    {
      type: "input",
      placeholder: "Description (English)",
      name: "description",
    },
    {
      type: "file",
      name: "image",
    },
    {
                type: "switch",
                name: "status",
                placeholder: "Status",
                returnType: "binary",
                activeLabel: "Active",
                inactiveLabel: "Inactive",

            },
    {
      type: "input",
      placeholder: "اسم المنطقة (اختياري)",
      name: "ar_name",
    },
    {
      type: "input",
      placeholder: "الوصف (اختياري)",
      name: "ar_description",
    },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Zones
      </h2>

      <div className="w-[90%] mx-auto">
        {/* Pass all fields to a single Add component */}
        <Add fields={fields} values={formData} onChange={handleInputChange} />
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