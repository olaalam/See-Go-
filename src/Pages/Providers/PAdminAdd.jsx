import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate, useParams } from "react-router-dom";

export default function Addprovider_admin() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    admin_position_id: "",
    status: "active",
    provider_id: id || "",
    image: null,
  });

  const [positionOptions, setPositionOptions] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const positionsRes = await fetch(
          `https://bcknd.sea-go.org/admin/provider_admin/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (positionsRes.ok) {
          const data = await positionsRes.json();
          if (data.provider_positions && Array.isArray(data.provider_positions)) {
            setPositionOptions(
              data.provider_positions.map((pos) => ({
                value: pos.id.toString(),
                label: pos.name,
              }))
            );
          } else {
            toast.error("Failed to load positions.");
          }
        } else {
          toast.error("Failed to fetch provider positions.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching data.",error);
      }
    };

    if (id) fetchData();
  }, [id, token]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    try {
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("email", formData.email);
      dataToSend.append("phone", formData.phone);
      dataToSend.append("password", formData.password);
      dataToSend.append("admin_position_id", parseInt(formData.admin_position_id, 10));
      dataToSend.append("status", formData.status === "active" ? "1" : "0");
      dataToSend.append("provider_id", parseInt(id, 10));
      if (formData.image) dataToSend.append("image", formData.image);

      const response = await fetch(
        "https://bcknd.sea-go.org/admin/provider_admin/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: dataToSend,
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Provider admin added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          admin_position_id: "",
          image: null,
          status: "active",
          provider_id: id || "",
        });

        navigate(`/providers/single-page-p/${id}`);
      } else {
        let errorMessage = "Failed to add provider admin.";

        if (result?.errors && typeof result.errors === "object") {
          errorMessage = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join(" | ");
        } else if (result?.message) {
          errorMessage = result.message;
        } else if (typeof result === "string") {
          errorMessage = result;
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

  const fields = [
    { type: "input", placeholder: "Admin Name", name: "name" },
    { type: "input", placeholder: "Email", name: "email" },
    { type: "input", placeholder: "Phone", name: "phone" },
    {
      type: "input",
      inputType: "password",
      placeholder: "Password",
      name: "password",
    },
    {
      type: "select",
      placeholder: "Select Position",
      name: "admin_position_id",
      options: positionOptions,
    },
    { type: "file", name: "image" },
    {
      type: "switch",
      name: "status",
      placeholder: "Status",
      returnType: "binary",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
    },
  ];

  return (
    <div className="w-[90%] p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Provider Admin
      </h2>

      <Add fields={fields} values={formData} onChange={handleInputChange} />
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
