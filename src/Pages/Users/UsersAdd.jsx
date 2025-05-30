import { useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function AddVillage() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    status: "",
    user_type: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    birthDate: "",
    rent_from: "",
    rent_to: "",
    parent_user_id: "",
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    const rentFrom = new Date(formData.rent_from);
    const rentTo = new Date(formData.rent_to);

    if (rentTo < rentFrom) {
      toast.error("Rent To date cannot be earlier than Rent From date.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.name);
    body.append("status", formData.status === "active" ? "1" : "0");
    body.append("email", formData.email);
    body.append("phone", formData.phone);
    body.append("password", formData.password);
    body.append("gender", formData.gender);
    body.append("birthDate", formatDate(formData.birthDate));
    body.append("rent_from", formatDate(formData.rent_from));
    body.append("rent_to", formatDate(formData.rent_to));
    body.append("parent_user_id", formData.parent_user_id);

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/user/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setTimeout(() => {
          navigate("/users");
        }, 1000);

        setFormData({
          name: "",
          status: "",
          user_type: "",
          email: "",
          phone: "",
          password: "",
          gender: "",
          birthDate: "",
          rent_from: "",
          rent_to: "",
          parent_user_id: "",
        });
      } else {
        let errorMessage = "Failed to add provider admin.";
        if (result?.errors && typeof result.errors === "object") {
          errorMessage = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join(" | ");
        } else if (result?.message) {
          errorMessage = result.message;
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
    { type: "input", placeholder: "User Name", name: "name" },
    { type: "input", inputType: "email", placeholder: "Email", name: "email" },
    { type: "input", placeholder: "Phone", name: "phone" },
    { type: "input", inputType: "password", placeholder: "Password", name: "password" },
    { type: "input", inputType: "date", placeholder: "BirthDate", name: "birthDate" },
    {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "binary",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
    },
    {
      type: "select",
      placeholder: "Gender",
      name: "gender",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
    },
  ];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add User
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
