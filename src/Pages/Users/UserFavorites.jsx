import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Loader2, Home, Map, Star, Briefcase, Clock } from "lucide-react";

export default function UserFavorites({ userId }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حالات الترقيم (Pagination) بناءً على الريسبونس الجديد
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1️⃣ تجهيز الهيدرز والـ Token
  const getAuthConfig = () => {
    const token = localStorage.getItem("token"); 
    return {
      headers: {
        Authorization: `Bearer ${token}`, 
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    };
  };

  // 2️⃣ جلب الموفرين المفضلين (Providers) باستخدام POST والـ Body المطلوب
  const fetchFavorites = async (page = 1) => {
    if (!userId) return;
    setLoading(true);
    try {
      const body = {
        user_id: Number(userId),
        search: "",
        per_page: 10 // يمكنك تعديل الرقم حسب الرغبة
      };

      // استخدام axios.post والـ Endpoint الجديد
      const response = await axios.post(
        `https://bcknd.sea-go.org/admin/user/favourite_provider?page=${page}`,
        body,
        getAuthConfig()
      );

      // قراءة البيانات بناءً على هيكلة الريسبونس الجديد المفتاح هو (favourite)
      const favData = response.data?.favourite;
      
      if (favData && Array.isArray(favData.data)) {
        setFavorites(favData.data);
        setCurrentPage(favData.current_page || 1);
        setTotalPages(favData.last_page || 1);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorite providers:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFavorites(1);
    }
  }, [userId]);

  // دالة للتأكد من رابط الصورة (تفضيل الـ image_link الراجع من الباكيند)
  const getProviderImage = (provider) => {
    if (provider.image_link) return provider.image_link;
    if (provider.image && provider.image !== "https://bcknd.sea-go.org/storage" && provider.image !== "https://bcknd.sea-go.org/storage/") {
      return provider.image;
    }
    return "https://placehold.co/150?text=Provider"; // صورة افتراضية
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center !py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#297878]" />
        <span className="!ms-2 text-bg-primary font-medium">Loading Favorites...</span>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className="!p-8 bg-[#f3fbfa] !ms-10 w-full text-center border-none shadow-none">
        <CardContent className="flex flex-col items-center gap-3 !py-6">
          <Heart className="w-12 h-12 text-gray-300" />
          <p className="text-bg-primary font-semibold text-lg">No Favorite Providers Found</p>
          <p className="text-sm text-gray-500">This user hasn't favorited any providers yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-[95%] !ms-10 flex flex-col gap-4">
      <div className="flex justify-between items-center !mb-2">
        <h3 className="text-lg font-semibold text-bg-primary">Favorite Providers</h3>
      </div>

      {/* تصميم شبكي مرن ومناسب لعرض بيانات الـ Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map((provider) => (
          <Card key={provider.id} className="bg-[#f3fbfa] border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="!p-4 flex gap-4 items-start">
              
              {/* صورة الـ Provider المستطيلة مع التقييم وحالة النشاط */}
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-[#297878]/10">
                <img
                  src={getProviderImage(provider)}
                  alt={provider.name || provider.ar_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://placehold.co/150?text=Provider" }}
                />
                {/* شارة التقييم (Rate) فوق الصورة */}
                {provider.rate && (
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    {Number(provider.rate).toFixed(1)}
                  </span>
                )}
                {/* مؤشر الحالة */}
                <span 
                  className={`absolute top-1 right-1 block h-3 w-3 rounded-full border-2 border-white ${
                    provider.status === 1 ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={provider.status === 1 ? 'Active Provider' : 'Inactive Provider'}
                />
              </div>

              {/* تفاصيل الـ Provider المعروضة */}
              <div className="flex flex-col gap-1 flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-bg-primary text-md truncate">
                    {provider.name || provider.ar_name || "No Name"}
                  </h4>
                </div>

                {/* نوع الخدمة (Service) - أيقونة حقيبة العمل */}
                {provider.service && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <Briefcase className="w-3.5 h-3.5 text-[#297878] flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2 text-justify">
                      {provider.service}
                    </p>
                  </div>
                )}

                {/* القرية (Village) - أيقونة المنزل */}
                {provider.village && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Home className="w-3.5 h-3.5 text-[#297878] flex-shrink-0" />
                    <span className="truncate" title={provider.village}>{provider.village}</span>
                  </div>
                )}

                {/* المنطقة (Zone) - أيقونة الخريطة */}
                {provider.zone && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Map className="w-3.5 h-3.5 text-[#297878] flex-shrink-0" />
                    <span className="truncate" title={provider.zone}>{provider.zone}</span>
                  </div>
                )}

                {/* مواعيد العمل (Open Hours) - أيقونة الساعة */}
                {(provider.open_from || provider.open_to) && (
                  <div className="text-[10px] text-[#297878] font-medium bg-[#297878]/5 px-2 py-0.5 rounded w-fit flex items-center gap-1 !mt-1">
                    <Clock className="w-3 h-3 text-[#297878]" />
                    <span>Hours: {provider.open_from || "—"} - {provider.open_to || "—"}</span>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* أزرار التنقل بين الصفحات (Pagination Controls) إذا كانت الصفحات أكثر من 1 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 !mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => fetchFavorites(currentPage - 1)}
            className="px-3 py-1 bg-white border rounded text-xs text-bg-primary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => fetchFavorites(currentPage + 1)}
            className="px-3 py-1 bg-white border rounded text-xs text-bg-primary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}