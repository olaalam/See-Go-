"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTableLayout";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import FullPageLoader from "@/components/Loading";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

// ✅ دالة الصلاحيات
const getUserPermissions = () => {
  try {
    const permissions = localStorage.getItem("userPermission");
    const parsed = permissions ? JSON.parse(permissions) : [];
    return parsed.map((perm) =>
      `${perm.module?.toLowerCase().replace(/\s+/g, "_")}:${perm.action?.toLowerCase()}`
    );
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return [];
  }
};

const hasPermission = (permissions, permission) => {
  const match = permission.match(/^Invoice(.*)$/i);
  if (!match) return false;
  const permKey = match[1].toLowerCase();
  const fullPerm = `invoice:${permKey}`;
  return permissions.includes(fullPerm) || permissions.includes("invoice:all");
};

const InvoiceList = ({ villageId, providerId, entityType }) => {
  const location = useLocation();
  const isLoadingFromRedux = useSelector((state) => state.loader.isLoading);
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const isProviderPage =
    location.pathname.includes("/providers/") || entityType === "provider";

  const entityId = isProviderPage ? providerId : villageId;
  const currentEntityType = isProviderPage ? "provider" : "village";

  // ✅ تحميل الصلاحيات عند بدء التحميل
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  const fetchInvoices = useCallback(async () => {
    if (!entityId) {
      setError(
        `${currentEntityType === "provider" ? "Provider" : "Village"} ID is missing.`
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authorization token not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const apiUrl =
        currentEntityType === "provider"
          ? `https://bcknd.sea-go.org/admin/invoice/provider/${entityId}`
          : `https://bcknd.sea-go.org/admin/invoice/village/${entityId}`;

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && Array.isArray(response.data.invoices)) {
        const formatted = response.data.invoices.map((u, index) => ({
          id: index,
          name: u.name || `Invoice ${index + 1}`,
          total_before_discount: u.total_before_discount,
          discount: u.discount,
          amount: u.amount,
          status: u.status === "paid" ? "paid" : "unpaid",
          invoiceDetails: {
            ...u,
            id: index,
            [currentEntityType]: response.data[currentEntityType],
            package: response.data.package || {},
            entityType: currentEntityType,
          },
        }));
        setInvoiceData(formatted);
      } else {
        setError("Unexpected response format. See console.");
        console.warn("Bad API response:", response.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        axios.isAxiosError(err) && err.response
          ? err.response.data.message ||
              `Error: ${err.response.status} ${err.response.statusText}`
          : err.message || "Failed to fetch data."
      );
    } finally {
      setLoading(false);
    }
  }, [entityId, currentEntityType]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const columns = [
    { key: "name", label: "Package Name" },
    { key: "total_before_discount", label: "Amount" },
    { key: "discount", label: "Discount" },
    { key: "amount", label: "Total" },
    {
      key: "view",
      label: "View Invoice",
      render: (row) => (
        <Link
          to={`invoice/${row.id}`}
          state={{
            invoiceData: row.invoiceDetails,
            entityType: currentEntityType,
            entityId: entityId,
          }}
          className="text-blue-600 hover:underline"
        >
          View
        </Link>
      ),
    },
    {
      key: "statusText",
      label: "Status",
      render: (row) => (
        <span
          className={`!px-2 !py-1 rounded-full text-white text-xs font-semibold ${
            row.status === "paid" ? "bg-green-300" : "bg-red-500"
          }`}
        >
          {row.status === "paid" ? "Paid" : "Unpaid"}
        </span>
      ),
    },
  ];

  if (isLoadingFromRedux || loading) return <FullPageLoader />;

  if (!hasPermission(permissions, "Invoice:view")) {
    return (
      <div className="p-4 text-center text-red-600 font-bold">
        You do not have permission to view invoices.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 font-bold">
        Error: {error}
        <p>Please ensure you are logged in and have the correct permissions.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <DataTable
        data={invoiceData}
        columns={columns}
        showAddButton={false}
        showActions={false}
        showEditButton={false}
        showDeleteButton={false}
        filterOptions={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "All", value: "all" },
              { label: "Paid", value: "paid" },
              { label: "Unpaid", value: "unpaid" },
            ],
          },
        ]}
      />
    </div>
  );
};

export default InvoiceList;
