import { useState, useEffect } from "react";
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

  const [availableActions, setAvailableActions] = useState([]);
  const [positions, setPositions] = useState([]); // Add state for positions

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    gender: "",
    status: "active",
    image: null,
    admin_position_id: "",
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch positions when component mounts
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/admins", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.position && Array.isArray(data.position)) {
          setPositions(data.position);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
        toast.error("Failed to fetch positions", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    fetchPositions();
  }, [token]);

  // Fetch provider actions when role is 'provider'
  useEffect(() => {
    if (formData.role === "provider") {
      fetch("https://bcknd.sea-go.org/admin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.actions)) {
            setAvailableActions(data.actions);
          }
        })
        .catch((error) => {
          console.error("Error fetching provider roles:", error);
        });
    }
  }, [formData.role, token]);

  const handleSubmit = async () => {
    dispatch(showLoader());

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("gender", formData.gender);
    formDataToSend.append("status", formData.status === "active" ? "1" : "0");
    formDataToSend.append("admin_position_id", formData.admin_position_id);

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    // Append actions for provider
    if (formData.role === "provider" && Array.isArray(formData.action)) {
      formData.action.forEach((act) => {
        formDataToSend.append("action[]", act);
      });
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
          admin_position_id: "",
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
      name: "admin_position_id", // Changed from "role" to "admin_position_id"
      options: positions.map(position => ({
        value: position.id,
        label: position.name
      })),
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