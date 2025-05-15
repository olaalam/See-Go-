import { useState} from "react";
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
    en: {
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
    },
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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    const rentFrom = new Date(formData.en.rent_from);
    const rentTo = new Date(formData.en.rent_to);

    if (rentTo < rentFrom) {
      toast.error("Rent To date cannot be earlier than Rent From date.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.en.name);
    body.append("status", formData.en.status === "active" ? "1" : "0");
    body.append("email", formData.en.email);
    body.append("phone", formData.en.phone);
    body.append("password", formData.en.password);
    body.append("gender", formData.en.gender);
    body.append("birthDate", formatDate(formData.en.birthDate));
    body.append("rent_from", formatDate(formData.en.rent_from));
    body.append("rent_to", formatDate(formData.en.rent_to));
    body.append("user_type", formData.en.user_type);
    body.append("parent_user_id", formData.en.parent_user_id);

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/user/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (response.ok) {
        toast.success("User added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          en: {
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
          },
        });
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Failed to add User.", {
          position: "top-right",
          autoClose: 3000,
        });
      }


  navigate("/users");
    } catch (error) {
      console.error("Error submitting User:", error);
      toast.error("An error occurred!", {
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
      type: "input",
      inputType: "date",
      placeholder: "Rent_From",
      name: "rent_from",
      showIf: (values) => values.user_type === "rent",
    },
    {
      type: "input",
      inputType: "date",
      placeholder: "Rent_To",
      name: "rent_to",
      showIf: (values) => values.user_type === "rent",
    },
    { type: "input", placeholder: "Follower User", name: "parent_user_id" },
    {
      type: "select",
      placeholder: "Status",
      name: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
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
    {
      type: "select",
      placeholder: "User Type",
      name: "user_type",
      options: [
        { value: "rent", label: "Rent" },
        { value: "owner", label: "Owner" },
        { value: "visitor", label: "Visitor" },
      ],
    },
  ];

  return (
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add User
      </h2>

      <Add
        fields={fieldsEn}
        lang="en"
        values={formData.en}
        onChange={handleFieldChange}
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
