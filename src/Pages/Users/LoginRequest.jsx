"use client";
import React, { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Users, Check, X, AlertTriangle } from "lucide-react";

const OnlineUsers = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const token = localStorage.getItem("token");
  
  // حالة فلترة القرى المضافة
  const [selectedVillage, setSelectedVillage] = useState("");

  // حالات التحكم في مودال التأكيد الديناميكي
  const [selectedRow, setSelectedRow] = useState(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [currentStatusAction, setCurrentStatusAction] = useState(""); // 'approve' أو 'reject'
  const [isProcessing, setIsProcessing] = useState(false);

  // جلب الصلاحيات من localStorage
  const getUserPermissions = () => {
    try {
      const permissionsData = localStorage.getItem("userPermission");
      const parsed = permissionsData ? JSON.parse(permissionsData) : [];
      return parsed.map((perm) => `${perm.module}:${perm.action}`);
    } catch (error) {
      console.error("Error parsing user permissions:", error);
      return [];
    }
  };

  const hasPermission = (permission) => {
    const match = permission.match(/^OnlineUsers(.*)$/i);
    if (!match) return false;
    const permKey = match[1].toLowerCase();
    const fullPerm = `OnlineUser:${permKey}`; 
    return permissions.includes(fullPerm);
  };

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchOnlineUsers = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/login_request", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const rawList = result?.login_requests?.data || result?.data || [];
      
      if (Array.isArray(rawList)) {
        setUsers(rawList);
      }
    } catch (error) {
      console.error("Error fetching online users:", error);
      toast.error("Failed to load online users data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  const handleActionClick = (user, actionType) => {
    setSelectedRow(user);
    setCurrentStatusAction(actionType);
    setIsActionOpen(true);
  };

  const handleStatusSubmit = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/login_request/status/${selectedRow.id}?status=${currentStatusAction}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success(`User request has been ${currentStatusAction === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
        setUsers(users.filter((u) => u.id !== selectedRow.id));
        setIsActionOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData?.message || `Failed to ${currentStatusAction} user request!`);
      }
    } catch (error) {
      console.error(`Error during ${currentStatusAction}:`, error);
      toast.error("An error occurred while processing your request");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedHours = String(hours).padStart(2, '0');

    return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
  };

  // استخراج قائمة بأسماء القرى الفريدة وغير الفارغة بشكل ديناميكي من البيانات المجلوبة
  const uniqueVillages = Array.from(
    new Set(users.map((u) => u.village).filter(Boolean))
  );

  // تصفية المصفوفة بناءً على القرية المختارة قبل إرسالها للجدول
  const filteredUsers = selectedVillage
    ? users.filter((u) => u.village === selectedVillage)
    : users;

  const columns = [
    { key: "id", label: "ID" },
    { key: "user_name", label: "Name" },
    { key: "user_phone", label: "Phone" },
    { key: "user_email", label: "Email" },
    { key: "village", label: "Village" },
    { key: "ip_address", label: "IP Address" },
    { 
      key: "created_at", 
      label: "Requested At",
      render: (row) => <span className="text-gray-600 font-medium">{formatDate(row.created_at)}</span>
    },    
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleActionClick(row, "approve")}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            title="Approve Request"
          >
            <Check className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleActionClick(row, "reject")}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Reject Request"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      {/* شريط يحتوي على العنوان وأداة الفلترة متراصين بشكل متجاوب */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 !mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-bg-primary" />
          <h2 className="text-xl font-semibold text-gray-800">Login Requests</h2>
        </div>

        {/* فلتر القرى المنسدل */}
        <div className="flex items-center gap-2">
          <label htmlFor="village-filter" className="text-sm font-medium text-gray-600">
            Filter by Village:
          </label>
          <select
            id="village-filter"
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]"
          >
            <option value="">All Villages</option>
            {uniqueVillages.map((village) => (
              <option key={village} value={village}>
                {village}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        showAddButton={false}
        showDeleteButton={false}
        showEditButton={false}
        showActions={false}
        showFilter={false}
        showSearch={true}
        searchKeys={["user_name", "user_email", "village","user_phone"]}
        className="table-compact"
      />

      {/* مودال التأكيد المرن والديناميكي البديل */}
      {isActionOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 !p-6 relative animate-scale-up">
            
            <button 
              onClick={() => setIsActionOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className={`!p-2 rounded-full ${currentStatusAction === "approve" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {currentStatusAction === "approve" ? <Check className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStatusAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </h3>
                <p className="text-sm text-gray-500 !mt-2">
                  Are you sure you want to <span className="font-semibold">{currentStatusAction}</span> the login request for{" "}
                  <span className="font-semibold text-gray-800">"{selectedRow.user_name}"</span>?
                </p>
              </div>
            </div>

            <div className="!mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsActionOpen(false)}
                disabled={isProcessing}
                className="!px-4 !py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusSubmit}
                disabled={isProcessing}
                className={`!px-4 !py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${
                  currentStatusAction === "approve" 
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                }`}
              >
                {isProcessing ? "Processing..." : currentStatusAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;