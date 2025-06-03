// InvoiceList.jsx
"use client";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import DataTable from "@/components/DataTableLayout";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import FullPageLoader from "@/components/Loading";
import { Link } from "react-router-dom";
import axios from "axios"; // Import Axios

const InvoiceList = () => {
    // apiUrl is not strictly needed if the full URL is hardcoded,
    // but kept for consistency if it's used elsewhere.
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const isLoadingFromRedux = useSelector((state) => state.loader.isLoading); // Renamed to avoid conflict
    const [invoiceData, setInvoiceData] = useState([]);
    const [loading, setLoading] = useState(true); // Manage local loading state
    const [error, setError] = useState(null); // To handle API errors

    // refetch function needs to be defined locally or imported from a custom hook
    // If useGet was a custom hook, we need to replicate its functionality or redefine it.
    // Assuming useGet provided refetch, loading, data, we'll implement similar logic here.
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear previous errors

        const token = localStorage.getItem("token"); // Get token from local storage

        if (!token) {
            setError("Authorization token not found. Please log in.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(
                "https://bcknd.sea-go.org/admin/invoice",
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`, // Include the authorization token
                    },
                }
            );
            
            // Axios automatically parses JSON, and the actual data is in response.data
            // Assuming your API returns an object like { invoices: [...] }
            if (response.data && Array.isArray(response.data.invoices)) {
                const formatted = response.data.invoices.map((u) => {
                    return {
                        id: u.id,
                        name: u.name,
                        total_before_discount: u.total_before_discount,
                        discount: u.discount,
                        amount: u.amount,
                        status: u.status === "paid" ? "paid" : "unpaid",
                        invoiceDetails: u,
                    };
                });
                setInvoiceData(formatted);
            } else {
                console.warn("API response was missing 'invoices' array or malformed:", response.data);
                setError("Received unexpected data format from the server. Check console for details.");
            }

        } catch (err) {
            console.error("Failed to fetch invoices:", err);
            // Axios errors often have a 'response' property with more details
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || `Error: ${err.response.status} ${err.response.statusText}`);
            } else {
                setError(err.message || "Failed to load data. Please check your network.");
            }
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array for useCallback as fetchInvoices doesn't depend on external state/props

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]); // Trigger fetch when component mounts or fetchInvoices changes (which it won't here due to useCallback)

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
                    to={`invoice`}
                    state={{ invoiceData: row.invoiceDetails }}
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

    // Combine local loading with Redux loader state if necessary
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
                showActionColumns={false}
                filterByKey="status"
                filterOptions={["all", "paid", "unpaid"]}
                filterLabelsText={{
                    all: "All",
                    paid: "Paid",
                    unpaid: "Unpaid",
                }}
            />
        </div>
    );
};

export default InvoiceList;