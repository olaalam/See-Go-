// Addprovider_roles.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection"; // This is your custom Add component
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate } from "react-router-dom";

export default function Addprovider_roles() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    roles: [], // Changed to an empty array to hold multiple selected roles
    status: "",
  });

  const [availableRoles, setAvailableRoles] = useState([]); // State to store fetched roles

  // Fetch roles from API on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      dispatch(showLoader());
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/provider_roles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Map each role string to an object with 'value' and 'label'
          const rolesOptions = data.roles.map((role) => ({
            value: role, // The role name itself is the value
            label: role, // The role name itself is the label
          }));
          setAvailableRoles(rolesOptions);
        } else {
          toast.error("Failed to fetch roles.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast.error("An error occurred while fetching roles!", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchRoles();
  }, [dispatch, token]); // Dependencies for useEffect

  const handleInputChange = (name, value) => {
    // If the input is 'roles', ensure value is an array (from multi-select)
    // Otherwise, handle it as a single value
    setFormData((prev) => ({
      ...prev,
      [name]: value, // The Add component will already return an array for 'roles'
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    const body = new FormData();
    body.append("name", formData.name);

    // Join the array of selected roles into a comma-separated string
    // Example: "Owner,Pool,Security Man"
   formData.roles.forEach((role) => {
      body.append("roles[]", role); // Use "roles[]" or just "roles" depending on backend
    });
    body.append("status", formData.status === "active" ? "1" : "0");

    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/provider_roles/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (response.ok) {
        toast.success("provider role added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          name: "",
          roles: [], // Reset to empty array after successful submission
          status: "",
        });
        navigate(`/provider-roles`);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Failed to add provider role.";
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error submitting provider role:", error);
      toast.error("An error occurred!", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      dispatch(hideLoader());
    }
  };

  // Define the fields for the form
  const fields = [
    {
      type: "input",
      placeholder: "Name",
      name: "name",
    },
    {
      type: "multi-select", // <--- CHANGE THIS TO "multi-select"
      placeholder: "Roles",
      name: "roles",
      options: availableRoles,
      // You no longer need `multiple: true` here as the `MultiSelectDropdown` handles it
    },
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
    <div className="w-full p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
        Add Provider Roles
      </h2>

      <div className="w-[90%] mx-auto">
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