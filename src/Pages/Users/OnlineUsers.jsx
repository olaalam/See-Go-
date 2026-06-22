"use client";
import React, { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const OnlineUsers = ({ villageId }) => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "https://bcknd.sea-go.org";

  // دالة لتجهيز الـ Headers الخاصة بالتوثيق مثل مكون Zones
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // 1. جلب بيانات المستخدمين المتصلين باستخدام fetch العادي والـ Loader الخاص بـ Redux
  const fetchOnlineUsers = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(`${apiUrl}/admin/user/user_active?village_id=${villageId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // استخراج مصفوفة المستخدمين حسب شكل استجابة السيرفر
      const rawList = result.admins || result.data || result;
      if (Array.isArray(rawList)) {
        setUsers(rawList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching online users:", error);
      toast.error("Failed to load online users data");
    } finally {
      dispatch(hideLoader());
    }
  };

  // استدعاء الدالة عند تحميل الكامبوننت
  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  // 2. دالة عمل Force Logout باستخدام fetch العادي
  const handleForceLogout = async (userId) => {
    dispatch(showLoader());
    try {
      const response = await fetch(`${apiUrl}/admin/user/logout_user/${userId}`, {
        method: "GET", // تم الإبقاء عليها GET بناءً على مسار الـ API الخاص بكِ
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("User logged out successfully!");
        await fetchOnlineUsers(); // إعادة تحديث الجدول فوراً بعد الطرد
      } else {
        const errorData = await response.json();
        console.error("Force logout failed:", errorData);
        toast.error("Failed to force logout user!");
      }
    } catch (error) {
      console.error("Error during force logout:", error);
      toast.error("Error occurred while forcing logout!");
    } finally {
      dispatch(hideLoader());
    }
  };

  // 3. تعريف الأعمدة والنصوص مباشرة مثل Zones
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "User Name" },
    { key: "email", label: "Email" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 !p-2 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer flex items-center gap-2 transition-all"
          onClick={() => handleForceLogout(row.id)}
        >
          <LogOut className="w-4 h-4" />
          Force Logout
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4">
      {/* عرض اللودر المركزي الخاص بالـ Redux عند جلب البيانات أو الطرد القسري */}
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <div className="flex items-center gap-2 !mb-6">
        <Users className="w-6 h-6 text-bg-primary" />
        <h2 className="text-xl font-semibold text-gray-800">Online Users</h2>
      </div>

      <DataTable
        data={users}
        columns={columns}
        showFilter={false}
        searchKeys={["name"]}
        showSearch={true}
        showAddButton={false}
        showActions={false} // تم تفعيلها false لأن زر الأكشن مدمج بداخل مصفوفة الـ columns نفسها
        className="table-compact"
      />
    </div>
  );
};

export default OnlineUsers;