"use client";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/components/Loading";
import HeaderInvoiceImage from "@/assets/HeaderInvoice.png";
import FooterInvoiceImage from "@/assets/FooterInvoice.png";

const getUserPermissions = () => {
  try {
    const userData = localStorage.getItem("user");
    if (!userData) return [];
    
    const user = JSON.parse(userData);
    const roles = user.roles || [];
    
    // تحويل الـ roles لـ permissions format
    return roles.map((role) =>
      `${role.module?.toLowerCase().replace(/\s+/g, "_")}:${role.action?.toLowerCase()}`
    );
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return [];
  }
};

// Fixed permission checking function
const hasPermission = (permissions, permission) => {
  const requiredPermission = permission.toLowerCase();
  
  console.log("InvoiceCard - Checking permission:", requiredPermission);
  console.log("InvoiceCard - Available permissions:", permissions);
  
  // Check for invoice:all or the specific required permission
  const hasAccess = permissions.includes("invoice:all") || permissions.includes(requiredPermission);
  
  console.log("InvoiceCard - Permission granted:", hasAccess);
  return hasAccess;
};

export default function InvoiceCard() {
  const { id: entityId, invoiceId } = useParams();
  const location = useLocation();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const token = localStorage.getItem("token");

  const isProviderPage = location.pathname.includes("/providers/");
  const entityType = location.state?.entityType || (isProviderPage ? "provider" : "village");

  useEffect(() => {
    const userPermissions = getUserPermissions();
    console.log("InvoiceCard - User permissions loaded:", userPermissions);
    setPermissions(userPermissions);
  }, []);

  useEffect(() => {
    if (location.state?.invoiceData) {
      setInvoiceData(location.state.invoiceData);
      setLoading(false);
      return;
    }

    const fetchInvoiceData = async () => {
      if (!entityId) {
        setError(`${entityType === "provider" ? "Provider" : "Village"} ID is missing.`);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const apiUrl = entityType === "provider"
          ? `https://bcknd.sea-go.org/admin/invoice/provider/${entityId}`
          : `https://bcknd.sea-go.org/admin/invoice/village/${entityId}`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        const invoices = result.invoices || [];
        const invoiceIndex = invoiceId !== undefined ? parseInt(invoiceId) : 0;
        const invoice = invoices[invoiceIndex];

        if (invoice) {
          setInvoiceData({
            ...invoice,
            id: invoiceIndex,
            [entityType]: result[entityType],
            package: result.package || {
              name: "Standard Package",
              price: invoice.total_before_discount || 0,
              discount: invoice.discount || 0,
              feez: (invoice.total_before_discount || 0) - (invoice.amount || 0) - (invoice.discount || 0),
            },
            entityType,
          });
        } else {
          setError("Invoice not found.");
        }
      } catch (err) {
        console.error("Error fetching invoice data:", err);
        setError("Failed to load invoice data.");
        toast.error("Failed to load invoice data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [entityId, invoiceId, location.state, token, entityType]);

  // تحقق من الـ permissions - لكن لا نعرض loading للـ permissions لأن الـ ProtectedRoute هيتعامل معاها
  if (permissions.length > 0 && !hasPermission(permissions, "invoice:view")) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 font-medium">
          You do not have permission to view this invoice.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 font-medium">{error || "No invoice data available."}</p>
      </div>
    );
  }

  const entity = invoiceData[entityType];
  const packageData = invoiceData.package;
  const invoice = invoiceData;

  const invoiceDate = new Date().toLocaleDateString("en-US");
  const toDate = new Date(entity.to);
  const fromDate = new Date(entity.from);
  const totalDays = (toDate - fromDate) / (1000 * 60 * 60 * 24);
  const passedDays = (new Date() - fromDate) / (1000 * 60 * 60 * 24);
  const progress = totalDays > 0 ? Math.min((passedDays / totalDays) * 100, 100) : 0;

  const subtotal = invoice.total_before_discount || 0;
  const discount = invoice.discount || 0;
  const tax = packageData?.feez ?? ((subtotal - discount) - (invoice.amount || 0));
  const total = invoice.amount || (subtotal - discount + tax);

  return (
    <div className="!mt-5 !mb-15">
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
              <Badge className="!px-2 !mb-1 !py-0.5 border-none rounded-[10px] text-blue-400 bg-blue-100 text-sm">
                Invoice to:
              </Badge>
              <p className="font-medium text-sm">{entity.name || "N/A"}</p>
              <p className="text-gray-500 text-xs">{entity.location || "Location N/A"}</p>
            </div>
            <div className="text-right">
              <Badge className="!px-2 !me-10 !mb-1 !py-0.5 border-none rounded-[10px] text-blue-400 bg-blue-100 text-sm">
                Date:
              </Badge>
              <p className="font-medium text-sm !pe-5">{invoiceDate}</p>
            </div>
            <div>
              <Badge className="!px-2 !mb-1 !py-0.5 border-none rounded-[10px] text-blue-400 bg-blue-100 text-sm">
                Invoice number:
              </Badge>
              <p className="font-medium text-sm !px-2">N: {entity.id}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 !rounded-lg">
                <TableHead className="text-sm">
                  {entityType === "provider" ? "Provider Name" : "Village Name"}
                </TableHead>
                <TableHead className="text-sm">Zone</TableHead>
                <TableHead className="text-sm">Package</TableHead>
                <TableHead className="text-sm">Fees</TableHead>
                <TableHead className="text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm">
                  {entity.translations?.[0]?.value || entity.name || "N/A"}
                </TableCell>
                <TableCell className="text-sm">
                  {entity.zone?.translations?.[0]?.value || entity.zone?.name || "N/A"}
                </TableCell>
                <TableCell className="text-sm">{packageData.name || "N/A"}</TableCell>
                <TableCell className="text-sm">{packageData.feez?.toFixed(2) || "0.00"} EGP</TableCell>
                <TableCell className="text-sm">{invoice.amount?.toFixed(2) || "0.00"} EGP</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex mt-4 mb-2">
            <div className="!p-4 w-full max-w-md">
              <div className="text-right space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Discount ({packageData.discount || 0}%):</strong> -${discount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>TAX:</strong> ${tax.toFixed(2)}
                </p>
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-base font-bold text-gray-900">
                    <strong>Invoice Total:</strong> ${total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center !my-3">
            <span className="text-sm font-medium text-gray-600">
              Next Renewal Period:
            </span>
            <span className="text-sm font-semibold text-gray-900 ml-2">
              {toDate.toLocaleDateString("en-US")}
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