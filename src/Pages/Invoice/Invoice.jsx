"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import HeaderInvoiceImage from "@/assets/HeaderInvoice.png";
import FooterInvoiceImage from "@/assets/FooterInvoice.png";
import { Badge } from "@/components/ui/badge";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/components/Loading"; // Assuming you have a Loading component

// This component now receives villageId as a prop
export default function InvoiceCard({ villageId }) {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage

  useEffect(() => {
    const fetchInvoiceData = async () => {
      // Important: Check if villageId is provided from the prop
      if (!villageId) {
        setError("Village ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://bcknd.sea-go.org/admin/invoice/${villageId}`, // Dynamic API endpoint
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setInvoiceData(result);
      } catch (err) {
        console.error("Error fetching invoice data:", err);
        setError("Failed to load invoice data. Please try again.");
        toast.error("Failed to load invoice data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [villageId, token]); // Dependencies ensure re-fetch when villageId or token changes

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Ensure all necessary data parts exist before rendering
  if (!invoiceData || !invoiceData.village || !invoiceData.package) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>No invoice data available for this village.</p>
      </div>
    );
  }

  const { village, package: packageData } = invoiceData;

  // Calculate totals
  const subtotal = packageData.price || 0;
  const discount = packageData.discount || 0;
  const tax = packageData.feez || 0;
  const invoiceTotal = subtotal - discount + tax;

  // Format dates for display
  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // --- Start of fix ---
  // Parse the 'village.to' date more robustly
  const parsedRenewalDate = new Date(village.to);

  // Check if the parsed date is valid before formatting
  const renewalToDate =
    village.to && !isNaN(parsedRenewalDate.getTime())
      ? parsedRenewalDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";
  // --- End of fix ---

  return (
    <div className="!mt-5 !mb-15 ">
      <ToastContainer />
      <Card className="max-w-lg max-h-[100vh] bg-white !m-auto border-none shadow-lg rounded-lg overflow-hidden">
        <CardHeader
          className="text-start relative !p-9"
          style={{
            backgroundImage: `url(${HeaderInvoiceImage})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            color: "white",
          }}
        >
          <h1 className="text-xl bg-white top-6 left-3 absolute rounded-[10px] !mt-6 !px-4 !py-2 font-semibold text-bg-primary">
            Sea Go
          </h1>
        </CardHeader>

        <CardContent className="!px-6 !py-4">
          <div className="grid grid-cols-3 gap-5 !mb-2">
            <div>
              <Badge
                variant="outline"
                className={`!px-2 !mb-1 !py-0.5 cursor-pointer border-none rounded-[10px] text-blue-400 bg-blue-100 text-sm`}
              >
                Invoice to:
              </Badge>
              <p className="font-medium text-sm">
                {packageData?.village?.name || village.name || "N/A"}
              </p>
              <p className="text-gray-500 text-xs">
                {packageData?.village?.location ||
                  village.location ||
                  "Location N/A"}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className={`!px-2 !me-10 !mb-1 !py-0.5 cursor-pointer border-none rounded-[10px] text-blue-400 bg-blue-100 text-sm`}
              >
                Date:
              </Badge>
              <p className="font-medium text-sm">{invoiceDate}</p>
            </div>
            <div>
              <Badge
                variant="outline"
                className={`!px-2 !mb-1 !py-0.5 cursor-pointer border-none rounded-[10px] text-blue-400 bg-blue-100 text-sm`}
              >
                Invoice number:
              </Badge>
              <p className="font-medium text-sm !px-2">N: {village.id}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 !rounded-lg">
                <TableHead className="text-sm">Village Name</TableHead>
                <TableHead className="text-sm">Zone</TableHead>
                <TableHead className="text-sm">Package</TableHead>
                <TableHead className="text-sm">Fees</TableHead>
                <TableHead className="text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm">
                  {village.translations?.[0]?.value || village.name || "N/A"}
                </TableCell>
                <TableCell className="text-sm">
                  {village.zone?.translations?.[0]?.value ||
                    village.zone?.name ||
                    "N/A"}
                </TableCell>
                <TableCell className="text-sm">
                  {packageData.translations?.[0]?.value ||
                    packageData.name ||
                    "N/A"}
                </TableCell>
                <TableCell className="text-sm">{packageData.feez}EGP</TableCell>
                <TableCell className="text-sm">
                  {packageData.price?.toFixed(2) || "0.00"} EGP
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex  mt-4 mb-2">
            <div className=" !p-4 w-full max-w-md">


              {/* Invoice Details */}
              <div className="text-right space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Discount ({packageData.discount || 0}%):</strong> -$
                  {discount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>TAX:</strong> ${tax.toFixed(2)}
                </p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    <strong>Invoice Total:</strong> ${invoiceTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
                        {/* Next Renewal Period */}
              <div className="flex justify-center items-center !my-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Next Renewal Period:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {renewalToDate}
                </span>
              </div>
        </CardContent>

        <CardFooter
          className="text-start !p-9"
          style={{
            backgroundImage: `url(${FooterInvoiceImage})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            color: "white",
          }}
        ></CardFooter>
      </Card>
    </div>
  );
}