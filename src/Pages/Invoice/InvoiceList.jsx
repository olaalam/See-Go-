"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTableLayout";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import FullPageLoader from "@/components/Loading";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const InvoiceList = ({ villageId, providerId, entityType }) => {
  const location = useLocation();
  const isLoadingFromRedux = useSelector((state) => state.loader.isLoading);
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if we're on a provider page
  const isProviderPage = location.pathname.includes("/providers/") || entityType === "provider";
  
  // Get the correct ID and entity type
  const entityId = isProviderPage ? providerId : villageId;
  const currentEntityType = isProviderPage ? "provider" : "village";

  const fetchInvoices = useCallback(async () => {
    if (!entityId) {
      setError(`${currentEntityType === "provider" ? "Provider" : "Village"} ID is missing.`);
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
      // Use different API endpoints based on entity type
      const apiUrl = currentEntityType === "provider" 
        ? `https://bcknd.sea-go.org/admin/invoice/provider/${entityId}`
        : `https://bcknd.sea-go.org/admin/invoice/village/${entityId}`;

      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && Array.isArray(response.data.invoices)) {
        // Add index as id since invoices don't have unique IDs
        const formatted = response.data.invoices.map((u, index) => ({
          id: index, // Use index as ID
          name: u.name || `Invoice ${index + 1}`, // Fallback name
          total_before_discount: u.total_before_discount,
          discount: u.discount,
          amount: u.amount,
          status: u.status === "paid" ? "paid" : "unpaid",
          invoiceDetails: {
            ...u,
            id: index, // Add id to invoice details
            [currentEntityType]: response.data[currentEntityType], // Include village or provider data
            package: response.data.package || {}, // Include package data if available
            entityType: currentEntityType // Add entity type to invoice details
          },
        }));
        setInvoiceData(formatted);
      } else {
        console.warn(
          "API response was missing 'invoices' array or malformed:",
          response.data
        );
        setError(
          "Received unexpected data format from the server. Check console for details."
        );
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.message ||
            `Error: ${err.response.status} ${err.response.statusText}`
        );
      } else {
        setError(
          err.message || "Failed to load data. Please check your network."
        );
      }
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
          to={`invoice/${row.id}`} // Include the invoice ID in the URL
          state={{ 
            invoiceData: row.invoiceDetails,
            entityType: currentEntityType,
            entityId: entityId
          }} // Pass invoice data and entity info via state
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

  if (isLoadingFromRedux || loading) {
    return <FullPageLoader />;
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