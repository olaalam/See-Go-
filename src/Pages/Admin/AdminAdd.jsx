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
      status: "",
      image: null,
  });
  const { name, phone, email, password, gender, role, status, image } = formData;
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const backendRoleValue = role === "provider" ? 1 : 0;
    const statusValue = status === "active" ? 1 : 0;

    const formDataToSend = new FormData();
    formDataToSend.append("name", name);
    formDataToSend.append("phone", phone);
    formDataToSend.append("email", email);
    formDataToSend.append("password", password);
    formDataToSend.append("provider_only", backendRoleValue);
    formDataToSend.append("gender", gender);
    formDataToSend.append("status", statusValue);



    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/admins/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success("admin added successfully!", {
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
            status: "",
            image: null,
        });
        navigate("/admin");
      } else {
        toast.error("Failed to add admin.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error submitting admin:", error);
      toast.error("An error occurred!", {
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
      type: "select",
      placeholder: "Status",
      name: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add admin
      </h2>

      <Add
        fields={fieldsEn}

        values={formData}
        onChange={handleInputChange}
      />

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