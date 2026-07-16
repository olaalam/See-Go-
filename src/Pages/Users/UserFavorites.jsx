import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Loader2, RefreshCw, Mail, Phone, User } from "lucide-react";

export default function UserFavorites({ userId }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ تجهيز الهيدرز والـ Token
  const getAuthConfig = () => {
    const token = localStorage.getItem("token"); 
    return {
      headers: {
        Authorization: `Bearer ${token}`, 
        Accept: "application/json",
      }
    };
  };

  // 2️⃣ جلب المستخدمين المفضلين بناءً على الـ user_id
  const fetchFavorites = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const config = {
        ...getAuthConfig(),
        params: { user_id: userId }
      };

      const response = await axios.get(
        `https://bcknd.sea-go.org/admin/user/favourite_users`,
        config
      );

      if (response.data && response.data.users && Array.isArray(response.data.users.data)) {
        setFavorites(response.data.users.data); 
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  // دالة للتأكد من صحة رابط الصورة وتجنب روابط الـ storage الفارغة
  const getUserImage = (imagePath) => {
    if (!imagePath || imagePath === "https://bcknd.sea-go.org/storage" || imagePath === "https://bcknd.sea-go.org/storage/") {
      return "/placeholder-avatar.png"; // يمكنك استبداله برابط صورة افتراضية لديك
    }
    return imagePath;
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
          <p className="text-bg-primary font-semibold text-lg">No Favorite Users Found</p>
          <p className="text-sm text-gray-500">This user hasn't favorited any users yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-[95%] !ms-10 flex flex-col gap-4">
      <div className="flex justify-between items-center !mb-2">
        <h3 className="text-lg font-semibold text-bg-primary">Favorite Users</h3>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map((user) => (
          <Card key={user.id} className="bg-[#f3fbfa] border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="!p-4 flex gap-4 items-center">
              
              {/* صورة المستخدم الدائرية مع مؤشر الحالة (نشط أم لا) */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={getUserImage(user.image)}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover border-2 border-[#297878]/20"
                  onError={(e) => { e.target.src = "https://placehold.co/150?text=User" }}
                />
                {/* نقطة خضراء للمستخدم النشط (status = 1) ونقطة رمادية لغير النشط */}
                <span 
                  className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white ${
                    user.status === 1 ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={user.status === 1 ? 'Active Account' : 'Inactive Account'}
                />
              </div>

              {/* تفاصيل المستخدم */}
              <div className="flex flex-col gap-1 flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-bg-primary text-md truncate">
                    {user.name || "No Name"}
                  </h4>
                  {/* شارة توضح نوع المستخدم (Owner / Visitor) */}
                  <span className={`text-[10px] font-medium !px-2 !py-0.5 rounded-full ${
                    user.user_type === 'Owner' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-teal-100 text-teal-800 border border-teal-200'
                  }`}>
                    {user.user_type}
                  </span>
                </div>

                {/* البريد الإلكتروني */}
                {user.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-[#297878] flex-shrink-0" />
                    <span className="truncate" title={user.email}>{user.email}</span>
                  </div>
                )}

                {/* رقم الهاتف */}
                {user.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-[#297878] flex-shrink-0" />
                    <span className="ltr-text">{user.phone}</span>
                  </div>
                )}

                {/* الجنس (اختياري) */}
                {user.gender && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase !mt-0.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>{user.gender}</span>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}