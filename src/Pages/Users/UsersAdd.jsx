import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Add from "@/components/AddFieldSection";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";

export default function AddVillage() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");

  const [villages, setVillages] = useState([]);

  const [formData, setFormData] = useState({
    en: {
      name: "",
      village: "",
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
    ar: {
      name: "",
      village: "",
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

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await fetch("https://bcknd.sea-go.org/admin/village", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.villages) {
          setVillages(
            data.villages.map((village) => ({
              label: village.name,
              value: village.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching villages", error);
      }
    };

    fetchVillages();
  }, []);

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
      return; // لا تتابع في حالة وجود خطأ
    }
  
    dispatch(showLoader());
  
    const body = new FormData();
    body.append("name", formData.en.name);
    body.append("village_id", formData.en.village);
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
            village: "",
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
          ar: {
            name: "",
            village: "",
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
    { type: "select", placeholder: "village", name: "village", options: villages },
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

  const fieldsAr = [
    { type: "input", placeholder: "اسم المستخدم", name: "name" },
    { type: "input", placeholder: "رقم الهاتف", name: "phone" },
    { type: "input", inputType: "email", placeholder: "البريد الإلكتروني", name: "email" },
    { type: "input", inputType: "password", placeholder: "كلمة المرور", name: "password" },
    { type: "input", inputType: "date", placeholder: "تاريخ الميلاد", name: "birthDate" },
    {
      type: "input",
      inputType: "date",
      placeholder: "تاريخ الإيجار من",
      name: "rent_from",
      showIf: (values) => values.user_type === "rent"||"زائر",
    },
    {
      type: "input",
      inputType: "date",
      placeholder: "تاريخ الإيجار إلى",
      name: "rent_to",
      showIf: (values) => values.user_type === "rent"||"زائر",
    },
    {
      type: "select",
      placeholder: "القرية",
      name: "village",
      options: villages,
    },
    {
      type: "select",
      placeholder: "الحالة",
      name: "status",
      options: [
        { value: "active", label: "نشط" },
        { value: "inactive", label: "غير نشط" },
      ],
    },
    {
      type: "select",
      placeholder: "نوع الحساب",
      name: "user_type",
      options: [
        { value: "rent", label: "مستأجر" },
        { value: "owner", label: "مالك" },
        { value: "visitor", label: "زائر" },
      ],
    },
    {
      type: "select",
      placeholder: "الجنس",
      name: "gender",
      options: [
        { value: "male", label: "ذكر" },
        { value: "female", label: "أنثى" },
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
      <Tabs defaultValue="english" className="w-full">
        <TabsList className="grid  !ms-3 w-[50%] grid-cols-2 gap-4 bg-transparent !mb-6">
          <TabsTrigger
            value="english"
            className="rounded-[10px] border text-bg-primary py-2 transition-all 
              data-[state=active]:bg-bg-primary data-[state=active]:text-white 
              hover:bg-teal-100 hover:text-teal-700"
          >
            English
          </TabsTrigger>
          <TabsTrigger
            value="arabic"
            className="rounded-[10px] border text-bg-primary py-2 transition-all 
              data-[state=active]:bg-bg-primary data-[state=active]:text-white 
              hover:bg-teal-100 hover:text-teal-700"
          >
            Arabic
          </TabsTrigger>
        </TabsList>
        <TabsContent value="english">
          <Add
            fields={fieldsEn}
            lang="en"
            values={formData.en}
            onChange={handleFieldChange}
          />
        </TabsContent>
        <TabsContent value="arabic">
          <Add
            fields={fieldsAr}
            lang="ar"
            values={formData.ar}
            onChange={handleFieldChange}
          />
        </TabsContent>
      </Tabs>
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
