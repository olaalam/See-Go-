"use client";
import React, { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { LogOut, Users, Eye, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const OnlineUsers = ({ villageId }) => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "https://bcknd.sea-go.org";

  // 🌟 States الخاصة بمودال عرض الـ Units بتاعة اليوزر
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
  const [isUnitsLoading, setIsUnitsLoading] = useState(false);
  const [selectedUserUnits, setSelectedUserUnits] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState("");

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

  // 🌟 جلب الوحدات (Units) الخاصة بيوزر معين وفتح المودال لعرضها
  const handleViewUnits = async (row) => {
    setSelectedUserName(row.name || row.email || `#${row.id}`);
    setIsUnitsModalOpen(true);
    setIsUnitsLoading(true);
    setSelectedUserUnits([]);

    try {
      const response = await fetch(`${apiUrl}/admin/user/online_user_units/${row.id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const unitsList = result.units || [];
      setSelectedUserUnits(Array.isArray(unitsList) ? unitsList : []);
    } catch (error) {
      console.error("Error fetching user units:", error);
      toast.error("Failed to load user's units");
    } finally {
      setIsUnitsLoading(false);
    }
  };

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
      key: "units",
      label: "Units",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          className="!bg-bg-primary hover:!bg-teal-600 !text-white !p-2 border-none cursor-pointer flex items-center gap-2 transition-all"
          onClick={() => handleViewUnits(row)}
        >
          <Eye className="w-4 h-4" />
          View
        </Button>
      ),
    },
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

      {isUnitsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 !p-4">
          <div className="bg-white rounded-[15px] !p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-center !mb-4 border-b border-gray-100 !pb-3">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-bg-primary" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Units — {selectedUserName}
                </h3>
              </div>
              <button
                onClick={() => setIsUnitsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isUnitsLoading ? (
              <p className="text-sm text-gray-400 text-center !py-8">Loading units...</p>
            ) : selectedUserUnits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center !py-8 italic">
                No units found for this user.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedUserUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="!p-4 rounded-[12px] border border-gray-100 bg-[#fcfdfd] flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">
                        Unit {unit.unit}
                      </span>
                      <span
                        className={`text-xs font-semibold !px-3 !py-1 rounded-full ${
                          unit.type === "owner"
                            ? "bg-teal-50 text-bg-primary"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {unit.type === "owner" ? "Owner" : "Renter"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>People: {unit.people ?? "—"}</span>
                      {unit.type === "renter" && (
                        <>
                          <span>From: {unit.from || "—"}</span>
                          <span>To: {unit.to || "—"}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;