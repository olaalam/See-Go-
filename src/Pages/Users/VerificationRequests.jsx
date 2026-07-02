"use client";
import React, { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Check, X, AlertTriangle, Clock, History } from "lucide-react";

const VerificationRequests = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  
  // حالات تخزين البيانات والتحكم في الـ Tabs
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // pending أو history
  const [permissions, setPermissions] = useState([]);
  const token = localStorage.getItem("token");

  // 🌟 حالات الـ Pagination والـ Params المطلوبة من الـ API
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(10); // القيمة الافتراضية لعناصر الصفحة
  const [fromDate, setFromDate] = useState(""); // فلتر تاريخ البداية (from)
  const [toDate, setToDate] = useState("");     // فلتر تاريخ النهاية (to)

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

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // 🌟 1️⃣ دالة جلب البيانات مع إرسال جميع الـ Params بشكل ديناميكي
  const fetchVerificationRequests = async (page = 1, search = "", from = "", to = "") => {
    dispatch(showLoader());
    try {
      // بناء الرابط والـ Query Parameters
      const url = new URL("https://bcknd.sea-go.org/admin/verification_request");
      
      url.searchParams.append("status", activeTab); // الـ Tab الحالي (pending / history)
      url.searchParams.append("page", page);        // الصفحة الحالية للـ Pagination
      url.searchParams.append("per_page", perPage);  // عدد العناصر في الصفحة الواحده
      
      if (search && search.trim() !== "") {
        url.searchParams.append("search", search.trim());
      }
      if (from) {
        url.searchParams.append("from", from);
      }
      if (to) {
        url.searchParams.append("to", to);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // التعامل مع جلب بيانات الـ Pagination من الباكيند ديناميكياً
      const paginatedData = result?.verification_requests || result || {};
      const rawList = paginatedData.data || [];
      
      setRequests(Array.isArray(rawList) ? rawList : []);
      
      // تحديث حالات الصفحات الكلية والعدد الإجمالي للـ DataTableLayout
      setCurrentPage(paginatedData.current_page || 1);
      setTotalPages(paginatedData.last_page || 1);
      setTotalItems(paginatedData.total || 0);

    } catch (error) {
      console.error("Error fetching verification requests:", error);
      toast.error("Failed to load verification requests");
      setRequests([]);
    } finally {
      dispatch(hideLoader());
    }
  };

  // 🌟 2️⃣ مراقبة التغيرات في الـ Params مع عمل Debounce خفيف للبحث والتواريخ لمنع كثرة الطلبات
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVerificationRequests(1, searchQuery, fromDate, toDate);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, fromDate, toDate, activeTab, perPage]);

  // عند تغيير الـ Tab نقوم بتصفير الصفحة إلى 1
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleActionClick = (row, actionType) => {
    setSelectedRow(row);
    setCurrentStatusAction(actionType);
    setIsActionOpen(true);
  };

  const handleStatusSubmit = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/verification_request/status/${selectedRow.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: currentStatusAction }),
        }
      );

      if (response.ok) {
        toast.success(`Request has been ${currentStatusAction === "approve" ? "Approved" : "Rejected"} successfully!`);
        // إعادة تحديث الصفحة الحالية بعد قبول أو رفض الطلب
        fetchVerificationRequests(currentPage, searchQuery, fromDate, toDate);
        setIsActionOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData?.message || `Failed to ${currentStatusAction} request!`);
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

  const baseColumns = [
    { key: "id", label: "ID" },
    { key: "user_name", label: "User Name", render: (row) => <span>{row.user?.name || row.user_name || "—"}</span> },
    { key: "user_phone", label: "Phone", render: (row) => <span>{row.user?.phone || row.user_phone || "—"}</span> },
    { key: "user_email", label: "Email", render: (row) => <span>{row.user?.email || row.user_email || "—"}</span> },
    { key: "created_at", label: "Requested At", render: (row) => <span className="text-gray-600 font-medium">{formatDate(row.created_at)}</span> },
  ];

  const columns = activeTab === "pending" 
    ? [
        ...baseColumns,
        {
          key: "actions",
          label: "Actions",
          render: (row) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleActionClick(row, "approve")}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors cursor-pointer"
                title="Approve"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleActionClick(row, "reject")}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                title="Reject"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ),
        },
      ]
    : [
        ...baseColumns,
        {
          key: "status",
          label: "Final Status",
          render: (row) => {
            const isApproved = row.status === "approve" || row.status === "approved";
            return (
              <span className={`font-semibold !px-2 !py-1 rounded text-xs border ${
                isApproved ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
              }`}>
                {isApproved ? "Approved" : "Rejected"}
              </span>
            );
          }
        }
      ];

  return (
    <div className="!p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <div className="flex items-center gap-2 !mb-6">
        <ShieldCheck className="w-6 h-6 text-bg-primary" />
        <h2 className="text-xl font-semibold text-gray-800">User Verification Requests</h2>
      </div>

      {/* شريط يحتوي على الـ Tabs وفلاتر التواريخ (From / To) والـ Per Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 !mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        {/* الـ Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 !p-1 rounded-lg w-fit">
          <button
            onClick={() => handleTabChange("pending")}
            className={`flex items-center gap-2 !px-4 !py-2 font-medium text-sm transition-all rounded-md cursor-pointer ${
              activeTab === "pending" ? "bg-white text-bg-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Requests
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`flex items-center gap-2 !px-4 !py-2 font-medium text-sm transition-all rounded-md cursor-pointer ${
              activeTab === "history" ? "bg-white text-bg-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        {/* 🌟 فلاتر الـ From & To & Per Page الإضافية المتاحة في طلب الـ API */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="from-date" className="text-xs text-gray-500 whitespace-nowrap">From:</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="!p-1.5 text-xs max-w-[140px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="to-date" className="text-xs text-gray-500 whitespace-nowrap">To:</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="!p-1.5 text-xs max-w-[140px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="per-page" className="text-xs text-gray-500 whitespace-nowrap">Show:</Label>
            <select
              id="per-page"
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg !p-1.5 bg-white text-xs focus:outline-none min-w-[70px]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🌟 ربط الـ DataTable مع الـ Backend Pagination بالكامل */}
      <DataTable
        data={requests}
        columns={columns}
        showAddButton={false}
        showDeleteButton={false}
        showEditButton={false}
        showActions={false}
        showFilter={false}
        showSearch={true}
        searchKeys={["user_name", "user_email", "user_phone"]}
        className="table-compact"

        // إعدادات الترقيم من السيرفر
        isBackendPagination={true}
        serverSide={true}
        currentPage={currentPage}
        backendCurrentPage={currentPage}
        totalPages={totalPages}
        backendTotalPages={totalPages}
        totalItems={totalItems}
        totalCount={totalItems}
        total={totalItems}

        onPageChange={(page) => {
          setCurrentPage(page);
          fetchVerificationRequests(page, searchQuery, fromDate, toDate);
        }}
        onBackendPageChange={(page) => {
          setCurrentPage(page);
          fetchVerificationRequests(page, searchQuery, fromDate, toDate);
        }}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
      />

      {/* مودال التأكيد */}
      {isActionOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 !p-6 relative animate-scale-up">
            <button onClick={() => setIsActionOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
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
                  Are you sure you want to <span className="font-semibold">{currentStatusAction}</span> the verification request for{" "}
                  <span className="font-semibold text-gray-800">"{selectedRow.user?.name || selectedRow.user_name || "this user"}"</span>?
                </p>
              </div>
            </div>
            <div className="!mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsActionOpen(false)} disabled={isProcessing} className="!px-4 !py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleStatusSubmit} disabled={isProcessing} className={`!px-4 !py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${
                currentStatusAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}>
                {isProcessing ? "Processing..." : currentStatusAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;