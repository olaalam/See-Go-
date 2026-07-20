import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import FullPageLoader from "@/components/Loading";
import { usePost } from "@/Hooks/UsePost";
import { useNavigate } from "react-router-dom";
import TitleSection from "@/components/TitleSection";
import { useGet } from "@/Hooks/UseGet";
import Add from "@/components/AddFieldSection"; // المكون المشترك[cite: 16]
import { formatDateForBackend } from "@/utils/rentHelpers";

export default function UnitCode() {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "https://bcknd.sea-go.org";
  const apiUrl = baseUrl.endsWith("/admin") ? baseUrl : `${baseUrl}/admin`;

  const { postData, loadingPost, response } = usePost({
    url: `${apiUrl}/appartment/create_code`,
  });
  const { loading: loadingAppartment, data: AppartmentData } = useGet({
    url: `${apiUrl}/appartment/appartement_list`,
  });

  const [allAppartments, setAllAppartments] = useState([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    en: {
      type: "",
      appartment: "",
      people: "",
      from: "",
      to: "",
      image: [],
    },
  });

  useEffect(() => {
    const rawData =
      AppartmentData?.data?.data || AppartmentData?.data || AppartmentData;
    const apartmentsList = Array.isArray(rawData)
      ? rawData
      : rawData?.appartments || rawData?.data || [];

    if (Array.isArray(apartmentsList)) {
      const formatted = apartmentsList.map((appartment) => ({
        label: appartment.unit || appartment.name || `Unit ${appartment.id}`,
        value: appartment.id.toString(),
      }));
      setAllAppartments(formatted);
    }
  }, [AppartmentData]);
  useEffect(() => {
    if (response) {
      // بناءً على الـ Preview في صورتك، الكود يأتي داخل خاصية success مباشرة أو داخل data.success
      const code = response?.success || response?.data?.success;
      if (code) {
        setGeneratedCode(code.toString());
      }
    }
  }, [response]);

  // دالة التعامل مع التغييرات الموحدة[cite: 17, 21]
  const handleFieldChange = (lang, name, value) => {
    const targetLang = lang || "en";
    setFormData((prev) => ({
      ...prev,
      [targetLang]: {
        ...prev[targetLang],
        [name]: value,
      },
    }));
    setGeneratedCode("");
  };

  // تعريف الحقول باستخدام useMemo لضمان استقرار المكون[cite: 17]
  const fields = useMemo(
    () => [
      {
        lang: "en",
        type: "select",
        placeholder: "Type",
        name: "type",
        required: true,
        options: [
          { value: "owner", label: "Owner" },
          { value: "renter", label: "Renter" },
        ],
      },
      {
        lang: "en",
        type: "select",
        placeholder: "Apartment",
        name: "appartment",
        options: allAppartments, // المكون Add سيتولى البحث تلقائياً
        value: formData.en.appartment,
      },
      {
        lang: "en",
        type: "input",
        inputType: "number",
        placeholder: "Number of People",
        name: "people",
        required: true,
      },
      ...(formData.en.type === "renter"
        ? [
            {
              lang: "en",
              type: "input",
              inputType: "date",
              name: "from",
              placeholder: "From",
              value: formData.en.from,
            },
            {
              lang: "en",
              type: "input",
              inputType: "date",
              name: "to",
              placeholder: "To",
              value: formData.en.to,
            },
{
              lang: "en",
              type: "file",
              placeholder: "Apartment Images",
              name: "image", // التعديل هنا
              accept: "image/*",
              multiple: true, // التعديل هنا: إضافة هذه الخاصية
            },
          ]
        : []),
    ],
    [
      allAppartments,
      formData.en.appartment,
      formData.en.type,
      formData.en.from,
      formData.en.to,
    ],
  );

const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratedCode("");
    const body = new FormData();
    body.append("appartment_id", formData.en.appartment);
    body.append("type", formData.en.type);
    body.append("people", formData.en.people);
    
if (formData.en.type === "renter") {
      body.append("from", formatDateForBackend(formData.en.from));
      body.append("to", formatDateForBackend(formData.en.to));
      
      // التعديل هنا: إجبار الإرسال بصيغة مصفوفة image[]
      if (formData.en.image) {
        if (formData.en.image instanceof File) {
          // لو ملف واحد برضه ابعته كـ image[]
          body.append("image[]", formData.en.image); 
        } else if (formData.en.image.length > 0) {
          // لو مصفوفة ملفات
          const imageArray = Array.from(formData.en.image);
          imageArray.forEach((img) => {
            body.append("image[]", img); 
          });
        }
      }
    }
    postData(body, "Apartment added successfully!");
  };

  return (
    <div className="w-full flex flex-col gap-5 p-6 relative">
      {(isLoading || loadingAppartment) && <FullPageLoader />}
      <ToastContainer />
      <h2 className="text-bg-primary text-center text-2xl font-semibold">
        <TitleSection text={"Create Code"} />
      </h2>

      {!generatedCode ? (
        <>
          <Add fields={fields} values={formData} onChange={handleFieldChange} />
          <Button
            onClick={handleSubmit}
            className="bg-bg-primary !mt-5 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px]"
            disabled={loadingPost}
          >
            {loadingPost ? "Processing" : "Done"}
          </Button>
        </>
      ) : (
        <div className="!my-8 !p-6 border rounded-2xl bg-white shadow-lg max-w-lg !mx-auto text-center">
          <p className="text-xl font-semibold text-gray-800">
            Your Generated Code
          </p>
          <div className="!my-4 !p-3 bg-gray-50 border border-teal-400 font-mono text-lg text-teal-700">
            {generatedCode}
          </div>
        </div>
      )}
    </div>
  );
}
