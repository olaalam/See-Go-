import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "axios";
import DataTable from "@/components/DataTableLayout";
import Loading from "@/components/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RejectDialog from "./RejectDialog";

export default function PaymentsPage() {
  const [tab, setTab] = useState("Pending Payments");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState({});
  const [showRejectInput, setShowRejectInput] = useState(null);

  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://bcknd.sea-go.org/admin/payments",
        {
          headers: getAuthHeaders(),
        }
      );

      let result = [];
      if (tab === "History Payments") {
        result = response.data.history_payments || [];
      } else if (tab === "Pending Payments") {
        result = response.data.pending_payments || [];
      }

      setData(result);
    } catch (error) {
      toast.error("Failed to fetch Payments.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleApprove = async (id) => {
    try {
      await axios.put(
        `https://bcknd.sea-go.org/admin/payments/approve/${id}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success("Payment approved.");
      fetchData();
    } catch {
      toast.error("Failed to approve payment.");
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReason[id];
    if (!reason || reason.trim() === "") {
      toast.warn("Please enter a rejection reason.");
      return;
    }
    try {
      await axios.put(
        `https://bcknd.sea-go.org/admin/payments/reject/${id}?rejected_reason=${encodeURIComponent(
          reason
        )}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success("Payment rejected.");
      setShowRejectInput(null);
      fetchData();
    } catch {
      toast.error("Failed to reject payment.");
    }
  };

  const baseColumns = [
    {
      key: "Payment",
      label: "Payment Method",
      render: (row) => row.payment_method?.name || "N/A",
    },
    {
      key: "date",
      label: "Date",
      render: (row) => row.start_date || "N/A",
    },
    {
      key: "type",
      label: "Type",
      render: (row) => row.type || "N/A",
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => row.amount || "N/A",
    },
  ];

  const actionColumn = {
    key: "actions",
    label: "Actions",
    render: (row) => {
      if (tab === "History Payments") {
        const status = row.status || "N/A";
        return (
          <div className="flex flex-col gap-2">
            <span
              className={`text-sm ${
                status === "approved" ? "text-green-600" : "text-red-600"
              }`}
            >
              {status === "approved" ? "Approved" : "Rejected"}
            </span>
          </div>
        );
      }

      return (
        <>
          <div className="flex items-center justify-center !mt-2 !pt-2 gap-4">
            {/* Accept Button */}
            <button
              onClick={() => handleApprove(row.id)}
              className="flex items-center justify-center gap-2 !px-5 !py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:bg-green-200 disabled:cursor-not-allowed disabled:scale-100"
              disabled={showRejectInput === row.id}
              aria-label="Accept item"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Accept
            </button>

            {/* Reject Button */}
            <button
              onClick={() => setShowRejectInput(row.id)}
              className="flex items-center justify-center gap-2 !px-5 !py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              aria-label="Reject item"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Reject
            </button>
          </div>

          {/* Modal Layer for Rejection Form */}
          {showRejectInput === row.id && (
            <RejectDialog
              open={true}
              onOpenChange={(val) => {
                if (!val) setShowRejectInput(null);
              }}
              selectedRow={row}
              onSave={() => handleReject(row.id)}
            >
              <textarea
                placeholder="Enter rejection reason..."
                value={rejectReason[row.id] || ""}
                onChange={(e) =>
                  setRejectReason({ ...rejectReason, [row.id]: e.target.value })
                }
                className="w-full border rounded-md !p-2 !mt-2 !my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[5px]"
              />
            </RejectDialog>
          )}
        </>
      );
    },
  };

  const columns = [...baseColumns, actionColumn];

  return (
    <div>
      <ToastContainer />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid !ms-3 w-[90%] grid-cols-2 gap-4 bg-transparent !mb-6">
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all data-[state=active]:bg-bg-primary data-[state=active]:text-white hover:bg-teal-100 hover:text-teal-700"
            value="Pending Payments"
          >
            Pending Payments
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all data-[state=active]:bg-bg-primary data-[state=active]:text-white hover:bg-teal-100 hover:text-teal-700"
            value="History Payments"
          >
            History Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} key={tab}>
          {loading ? (
            <Loading />
          ) : (
            <DataTable
              data={data}
              tab={tab}
              columns={columns}
              className="table-compact"
              showAddButton={false}
              showFilter={false}
              showActions={false}
              searchKeys={["payment_method.name"]}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
