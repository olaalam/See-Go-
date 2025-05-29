import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function Addadmin() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    gender: "",
    role: "",
    status: "active",
    image: null,
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("gender", formData.gender);
    formDataToSend.append("provider_only", formData.role === "provider" ? "1" : "0");
    formDataToSend.append("status", formData.status === "active" ? "1" : "0");

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/admins/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Admin added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          phone: "",
          email: "",
          password: "",
          gender: "",
          role: "",
          status: "active",
          image: null,
        });

        navigate("/admin");
      } else {
        let errorMessage = "Failed to add admin.";
        if (data?.errors && typeof data.errors === "object") {
          errorMessage = Object.values(data.errors)
            .flat()
            .join(", ");
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (typeof data === "string") {
          errorMessage = data;
        }

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error submitting admin:", error);
      toast.error("An unexpected error occurred.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  const fieldsEn = [
    { type: "input", placeholder: "Name", name: "name" },
    { type: "input", placeholder: "Phone", name: "phone" },
    { type: "input", placeholder: "Email", name: "email" },
    { type: "input", inputType: "password", placeholder: "Password", name: "password" },
    {
      type: "select",
      placeholder: "Gender",
      name: "gender",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
    },
    {
      type: "select",
      placeholder: "Role",
      name: "role",
      options: [
        { value: "all", label: "All" },
        { value: "admin", label: "Admin" },
        { value: "provider", label: "Provider" },
      ],
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
      type: "file",
      name: "image",
    },
  ];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add admin
      </h2>

      <Add fields={fieldsEn} values={formData} onChange={handleInputChange} />

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
