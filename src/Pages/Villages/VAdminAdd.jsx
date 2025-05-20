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
  const { id } = useParams();

  const [formData, setFormData] = useState({
    en: {
      name: "",
      email: "",
      phone: "",
      password: "",
      admin_position_id: "",
      status: "active",
      village_id: "",
    },
  });

  const [villageOptions, setVillageOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch villages
        const villagesRes = await fetch(
          "https://bcknd.sea-go.org/admin/village",
          {
            headers: getAuthHeaders(),
          }
        );

        if (villagesRes.ok) {
          const villagesData = await villagesRes.json();
          const currentLang = localStorage.getItem("lang") || "en";
          setVillageOptions(
            villagesData.villages.map((v) => ({
              value: v.id.toString(),
              label:
                v.translations?.find((t) => t.locale === currentLang)?.name ||
                v.name,
            }))
          );
        } else {
          toast.error("Failed to load villages.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching data.", error);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch villages
        const villagesRes = await fetch(
          `https://bcknd.sea-go.org/admin/village_admin/${id}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (villagesRes.ok) {
          const data = await villagesRes.json();
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

    fetchData();
  }, [token]);

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

    try {
      const dataToSubmit = formData.en;
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/village_admin/add",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: dataToSubmit.name,
            email: dataToSubmit.email,
            phone: dataToSubmit.phone,
            password: dataToSubmit.password,
            admin_position_id: parseInt(dataToSubmit.admin_position_id, 10),
            status: dataToSubmit.status === "active" ? 1 : 0,
            village_id: parseInt(dataToSubmit.village_id, 10),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Village admin added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        setFormData({
          en: {
            name: "",
            email: "",
            phone: "",
            password: "",
            admin_position_id: "",
            status: "active",
            village_id: "",
          },
        });

        navigate(-1);
        navigate("/single-page-v");
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
      placeholder: "Select Position",
      name: "admin_position_id",
      options: positionOptions,
    },
    {
      type: "select",
      placeholder: "Select Village",
      name: "village_id",
      options: villageOptions,
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
        Add Village Admin
      </h2>

      <Add
        fields={fields}
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
