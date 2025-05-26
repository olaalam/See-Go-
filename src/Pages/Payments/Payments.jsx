import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "axios";
import DataTable from "@/components/DataTableLayout";
import Loading from "@/components/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RejectDialog from "./RejectDialog";
import { Button } from "@/components/ui/button"; // Import Button if not already there
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"; // Assuming you have these UI components for a modal/dialog

export default function PaymentsPage() {
  const [tab, setTab] = useState("Pending Payments");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false); // New state for receipt modal
  const [currentReceiptImage, setCurrentReceiptImage] = useState(""); // New state for receipt image URL

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
      console.error("Error fetching payments:", error);
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
    } catch (error) {
      toast.error("Failed to approve payment.");
      console.error("Error approving payment:", error);
    }
  };

  const handleRejectClick = (id) => {
    setSelectedPaymentId(id);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.warn("Please enter a rejection reason.");
      return;
    }
    try {
      await axios.put(
        `https://bcknd.sea-go.org/admin/payments/reject/${selectedPaymentId}?rejected_reason=${encodeURIComponent(
          rejectReason
        )}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success("Payment rejected.");
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedPaymentId(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to reject payment.");
      console.error("Error rejecting payment:", error);
    }
  };

  // Function to open receipt modal
  const handleViewReceipt = (receiptLink) => {
    setCurrentReceiptImage(receiptLink);
    setIsReceiptModalOpen(true);
  };

  const baseColumns = [
    {
      key: "payment_method.name",
      label: "Payment Method",
      render: (row) => row.payment_method?.name || "N/A",
    },
    {
      key: "village.name",
      label: "Village Name",
      render: (row) => row.village?.name || "N/A",
    },
    {
      key: "start_date",
      label: "Date",
      render: (row) => row.start_date || "N/A",
    },
    {
      key: "type",
      label: "Type",
      render: (row) => row.type || "N/A",
    },
    {
      key: "receipt_link",
      label: "Receipt",
      render: (row) => (
        // Render a button for the receipt link
        row.receipt_link ? (
          <Button
            onClick={() => handleViewReceipt(row.receipt_link)}
            className="bg-bg-primary hover:bg-teal-600 text-white !px-3 !py-1 rounded-md text-sm"
          >
            View Receipt
          </Button>
        ) : (
          "N/A"
        )
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => row.amount || "N/A",
    },
    {
      key: "discount",
      label: "Discount",
      render: (row) => row.discount || "N/A",
    },
  ];

  const columns = [
    ...baseColumns,
    {
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
        } else {
          return (
            <div className="flex items-center justify-center !mt-2 !pt-2 gap-4">
              <button
                onClick={() => handleApprove(row.id)}
                className="flex items-center justify-center gap-2 !px-5 !py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
                aria-label="Accept payment"
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

              <button
                onClick={() => handleRejectClick(row.id)}
                className="flex items-center justify-center gap-2 !px-5 !py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
                aria-label="Reject payment"
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
          );
        }
      },
    },
  ];
  // Prepare filter options for zone and status
  const statusFilterOptions = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

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
            <>
              <DataTable
                data={data}
                columns={columns}
                className="table-compact"
                showAddButton={false}
                showFilter={tab === "History Payments"}
                showActions={false}
                showEditButton={false}
                showDeleteButton={false}
                filterKey={tab === "History Payments" ? ["status"] : []}
                filterOptions={tab === "History Payments" ? statusFilterOptions : []}
                searchKeys={["payment_method.name", "type", "amount", "start_date"]}
              />

              {isRejectDialogOpen && (
                <RejectDialog
                  open={isRejectDialogOpen}
                  onOpenChange={setIsRejectDialogOpen}
                  onSave={handleRejectConfirm}
                >
                  <textarea
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full !p-2 !mt-2 !my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-[5px]"
                  />
                </RejectDialog>
              )}

              {/* Receipt Image Modal */}

<Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
  <DialogOverlay className="bg-black border-none opacity-50" />
  <DialogContent className="fixed border-none shadow-none flex items-center justify-center !p-4 [&>button]:hidden"> {/* Added [&>button]:hidden here */}
    <div className="relative bg-white rounded-lg !p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
      <h2 className="text-xl font-semibold !mb-4 text-bg-primary">Receipt Image</h2>
      {currentReceiptImage ? (
        <img
          src={currentReceiptImage}
          alt="Receipt"
          className="max-w-full h-auto mx-auto rounded-md"
        />
      ) : (
        <p>No receipt image available.</p>
      )}
      <Button
        onClick={() => setIsReceiptModalOpen(false)}
        className="!mt-4 bg-red-500 hover:bg-red-600 text-white !px-4 !py-2 rounded-md"
      >
        Close
      </Button>
    </div>
  </DialogContent>
</Dialog>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}