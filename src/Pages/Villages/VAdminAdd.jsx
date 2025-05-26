import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { useNavigate, useParams } from "react-router-dom";

export default function Addvillage_admin() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  // Get the 'id' from the URL parameters (which is your village_id)
  const { id: villageId } = useParams(); // Renamed 'id' to 'villageId' for clarity
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    admin_position_id: "",
    status: "active",
    // No need for village_id here, as it will come from params
  });

  // No need for villageOptions state as we're not selecting it from a dropdown
  // const [villageOptions, setVillageOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Removed the useEffect that fetches all villages, as it's no longer needed for the dropdown.
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const villagesRes = await fetch(
  //         "https://bcknd.sea-go.org/admin/village",
  //         {
  //           headers: getAuthHeaders(),
  //         }
  //       );
  //       if (villagesRes.ok) {
  //         const villagesData = await villagesRes.json();
  //         const currentLang = localStorage.getItem("lang") || "en";
  //         setVillageOptions(
  //           villagesData.villages.map((v) => ({
  //             value: v.id.toString(),
  //             label:
  //               v.translations?.find((t) => t.locale === currentLang)?.name ||
  //               v.name,
  //           }))
  //         );
  //       } else {
  //         toast.error("Failed to load villages.");
  //       }
  //     } catch (error) {
  //       toast.error("An error occurred while fetching data.", error);
  //     }
  //   };
  //   fetchData();
  // }, [token]);

  // This useEffect is for fetching positions, keep it.
  useEffect(() => {
    const fetchPositions = async () => { // Renamed for clarity
      try {
        const positionsRes = await fetch( // Renamed for clarity
          `https://bcknd.sea-go.org/admin/village_admin/${villageId}`, // Use villageId from params
          {
            headers: getAuthHeaders(),
          }
        );

        if (positionsRes.ok) {
          const data = await positionsRes.json();
          if (data.village_positions && Array.isArray(data.village_positions)) {
            console.log("Village positions:", data.village_positions);
            setPositionOptions(
              data.village_positions.map((pos) => ({
                value: pos.id.toString(),
                label: pos.name,
              }))
            );
          } else {
            toast.error("Failed to load positions.");
          }
        }
      } catch (error) {
        toast.error("An error occurred while fetching data.", error);
      }
    };
    fetchPositions();
  }, [token, villageId]); // Added villageId to dependencies

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    dispatch(showLoader());

    try {
      const dataToSubmit = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        admin_position_id: parseInt(formData.admin_position_id, 10),
        status: formData.status === "active" ? 1 : 0,
        village_id: parseInt(villageId, 10), // <<< IMPORTANT: Use villageId from params here
      };

      const response = await fetch(
        "https://bcknd.sea-go.org/admin/village_admin/add",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(dataToSubmit), // Send as JSON
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Village admin added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          admin_position_id: "",
          status: "active",
          // village_id: "", // No longer needed here
        });
        // Consider where you want to navigate after successful submission.
        // navigate(-1); // Navigates back to the previous page
        navigate(`/villages/single-page-v/${villageId}`); // Example: Navigate to a list of admins for THIS village
      } else {
        toast.error(
          `Failed to add village admin: ${
            data?.message || response.statusText
          }`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    } catch (error) {
      console.error("Error submitting village admin:", error);
      toast.error("An error occurred!", {
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
      placeholder: "Select Roles",
      name: "admin_position_id",
      options: positionOptions,
    },
    // REMOVED: No longer need the "Select Village" dropdown
    // {
    //   type: "select",
    //   placeholder: "Select Village",
    //   name: "village_id",
    //   options: villageOptions,
    // },
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
        Add Village Admin
      </h2>

      <Add
        fields={fields}
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