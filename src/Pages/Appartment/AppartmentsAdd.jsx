import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import FullPageLoader from "@/components/Loading";
import { usePost } from "@/Hooks/UsePost";
import { useNavigate } from "react-router-dom";
import { useAppartmentForm, AppartmentFormFields } from "./AppartmentForm";
import TitleSection from "@/components/TitleSection";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";

export default function AppartmentsAdd() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://bcknd.sea-go.org";
  const apiUrl = baseUrl.endsWith("/admin") ? baseUrl : `${baseUrl}/admin`;
  const { postData, loadingPost, response } = usePost({ url: `${apiUrl}/appartment/add` });
  const isLoading = useSelector((state) => state.loader.isLoading);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // الـ State الخاص بحالات الحظر (Ban Statuses) - قيم Boolean مبدئية للـ UI
  const [banStatuses, setBanStatuses] = useState({
    all_status: false,
    entrance_status: false,
    selling_status: false,
    rent_status: false,
    visits_status: false,
    pool_status: false,
    beach_status: false,
    rent_code_status: false,
    options_status:false,
  });

  const handleSwitchChange = (key, value) => {
    setBanStatuses((prev) => ({ ...prev, [key]: value }));
  };

  const {
    formData,
    fields,
    handleFieldChange,
    prepareFormData,
    loadingAppartment,
  } = useAppartmentForm(apiUrl);

const handleSubmit = async (e) => {  
  e.preventDefault();
  const body = prepareFormData();
  
  Object.keys(banStatuses).forEach((key) => {
    const cleanKey = key.trim(); 
    
    // 🛠️ الحل السحري: السيرفر يطلب 1 أو 0 في الـ FormData ليقرأها كـ true/false
    const stringValue = banStatuses[key] ? "1" : "0"; 
    
    if (body instanceof FormData) {
      body.delete(cleanKey); 
      body.append(cleanKey, stringValue);
    } else {
      body[cleanKey] = stringValue;
    }
  });

  postData(body, t("Appartmentaddedsuccessfully"));
};
useEffect(() => {
  // التحقق الصارم: لا تخرج من الصفحة إلا لو كان الرد حالة نجاح 200 أو 201
  if (!loadingPost && response) {
    if (response.status === 200 || response.status === 201) {
      setTimeout(() => {
        navigate(-1); // يخرج فقط في حالة النجاح التام
      }, 1500);
    }
  }
}, [response, loadingPost, navigate]);

  if (loadingAppartment) {
    return <FullPageLoader />;
  }

  return (
    <div className="w-full flex flex-col gap-5 p-6 relative">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <h2 className="text-bg-primary text-center text-2xl font-semibold">
        <TitleSection text={t("AddUnit")}/>
      </h2>
      <Tabs defaultValue="english" className="w-full">
        <TabsContent value="english" className="flex flex-col gap-6">
          <AppartmentFormFields 
            fields={fields}
            formData={formData}
            handleFieldChange={handleFieldChange}
          />

          {/* قسم الـ Switches الخاص بالـ Ban */}
          <div className="border-t !pt-5 !mt-4 bg-white">
            <h3 className="text-lg font-medium !mb-4 text-gray-700">{t("BanStatuses")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white">
              {Object.keys(banStatuses).map((statusKey) => (
                <div key={statusKey} className="flex items-center justify-between !p-3 border rounded-xl bg-gray-50/50 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">{t(statusKey)}</span>
                  <Switch 
                    checked={banStatuses[statusKey]} 
                    onCheckedChange={(checked) => handleSwitchChange(statusKey, checked)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div>
        <Button
          onClick={handleSubmit}
          className="bg-bg-primary !mb-10 !ms-3 cursor-pointer hover:bg-teal-600 !px-5 !py-6 text-white w-[30%] rounded-[15px] transition-all duration-200"
          disabled={loadingPost}
        >
          {loadingPost ? t("Processing") : t("Done")}
        </Button>
      </div>
    </div>
  );
}