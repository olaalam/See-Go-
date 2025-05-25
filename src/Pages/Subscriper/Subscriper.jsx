"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "axios";
import DataTable from "@/components/DataTableLayout";
import Loading from "@/components/Loading";
import DeleteDialog from "@/components/DeleteDialog";
import EditDialog from "@/components/EditDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

export default function SubscribersPage() {
  const [tab, setTab] = useState("all");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerPackages, setProviderPackages] = useState([]);
  const [villagePackages, setVillagePackages] = useState([]);
  const [services, setServices] = useState([]);
  const token = localStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://bcknd.sea-go.org/admin/subscriper",
        {
          headers: getAuthHeaders(),
        }
      );

      let result = [];
      switch (tab) {
        case "all":
          result = response.data.subscribers.map((sub) => ({ ...sub }));
          break;
        case "provider":
          result = response.data.subscribers_provider.map((sub) => ({
            ...sub,
          }));
          break;
        case "village":
          result = response.data.subscribers_village.map((sub) => ({ ...sub }));
          break;
        default:
          result = [];
      }

      setData(result || []);
      setPaymentMethods(response.data.payment_methods || []);
      setVillages(response.data.villages || []);
      setProviders(response.data.providers || []);
      setProviderPackages(response.data.provider_packages || []);
      setVillagePackages(response.data.village_packages || []);
      setServices(response.data.services || []);
    } catch (error) {
      toast.error("Failed to fetch subscribers.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleEdit = async (row) => {
    const formData = new FormData();
    formData.append(
      "payment_method_id",
      row.payment_method_id?.toString() || ""
    );
    formData.append("package_id", row.package_id?.toString() || "");
    formData.append("type", row.type);

    if (row.type === "provider") {
      formData.append("provider_id", row?.provider_id?.toString() || "");
      formData.append("service_id", row?.service_id?.toString() || "");
    } else if (row.type === "village") {
      formData.append("village_id", row?.village_id?.toString() || "");
    }

    try {
      await axios.post(
        `https://bcknd.sea-go.org/admin/subscriper/update/${row.id}`,
        formData,
        {
          headers: getAuthHeaders(),
        }
      );
      toast.success("Subscriber updated successfully.");
      fetchData();
    } catch (error) {
      console.error("Error updating subscriber:", error);
      toast.error("Failed to update subscriber.");
    }
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(
        `https://bcknd.sea-go.org/admin/subscriper/delete/${row.id}`,
        { headers: getAuthHeaders() }
      );
      toast.success("Subscriber deleted successfully.");
      setData((prevData) => prevData.filter((item) => item.id !== row.id));
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      toast.error("Failed to delete subscriber.");
    }
  };

  const handleEditClick = (row) => {
    const rowToEdit = { ...row };

    if (!rowToEdit.type) {
      rowToEdit.type = tab;
    }

    if (rowToEdit.payment_method_id === undefined && rowToEdit.payment_method?.id !== undefined) {
      rowToEdit.payment_method_id = rowToEdit.payment_method.id;
    }

    if (rowToEdit.package_id === undefined && rowToEdit.package?.id !== undefined) {
        rowToEdit.package_id = rowToEdit.package.id;
    }

    if (rowToEdit.type === "provider") {
      if (rowToEdit.provider_id === undefined && rowToEdit.provider?.id !== undefined) {
        rowToEdit.provider_id = rowToEdit.provider.id;
      }
      if (rowToEdit.service_id === undefined && rowToEdit.service?.id !== undefined) {
         rowToEdit.service_id = rowToEdit.service.id;
      } else if (rowToEdit.service_id === undefined && rowToEdit.service_name?.id !== undefined) {
         rowToEdit.service_id = rowToEdit.service_name.id;
      }
    } else if (rowToEdit.type === "village") {
      if (rowToEdit.village_id === undefined && rowToEdit.village?.id !== undefined) {
        rowToEdit.village_id = rowToEdit.village.id;
      }
    }

    setSelectedRow(rowToEdit);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedRow({ ...row, name: row.subscriber });
    setDeleteDialogOpen(true);
  };

  const getPackagesByType = (type) => {
    if (type === "provider") return providerPackages;
    if (type === "village") return villagePackages;
    return [];
  };

  const filterOptionsForZones = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const columns = [
    {
      key: "subscriber",
      label: "Subscriber Name",
      render: (row) => row.subscriber || "N/A",
    },
    {
      key: "type",
      label: "Type",
      render: (row) => row.type || "N/A",
    },
    {
      key: "date",
      label: "Date",
      render: (row) => row.start_date || "N/A",
    },
    {
      key: "payment_method",
      label: "Payment Method",
      render: (row) => row.payment_method?.name || "N/A",
    },
    {
      key: "expiry_date",
      label: "Expiry Date",
      render: (row) => row.expire_date || "N/A",
    },
    {
      key: "package",
      label: "Package",
      render: (row) => row.package?.name || "N/A",
    },
    ...(tab === "provider" || tab === "all"
      ? [
          {
            key: "associated_services",
            label: "Associated Services",
            render: (row) =>
              row.type === "village" ? "-" : row.service?.name || "N/A",
          },
        ]
      : []),
  ];

  return (
    <div>
      <ToastContainer />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid !ms-3 w-[90%] grid-cols-4 gap-4 bg-transparent !mb-6">
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                                 data-[state=active]:bg-bg-primary data-[state=active]:text-white
                                 hover:bg-teal-100 hover:text-teal-700"
            value="all"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                                 data-[state=active]:bg-bg-primary data-[state=active]:text-white
                                 hover:bg-teal-100 hover:text-teal-700"
            value="provider"
          >
            Provider
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                                 data-[state=active]:bg-bg-primary data-[state=active]:text-white
                                 hover:bg-teal-100 hover:text-teal-700"
            value="village"
          >
            Village
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                                 data-[state=active]:bg-bg-primary data-[state=active]:text-white
                                 hover:bg-teal-100 hover:text-teal-700"
            value="maintenance"
          >
            Maintenance Type
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
              addRoute="/subscribers/add"
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              searchKeys={["type", "subscriber", "payment_method"]}
              filterKey={["status"]}
              filterOptions={filterOptionsForZones}
            />
          )}

          <EditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            selectedRow={selectedRow}
            onSave={() => {
              handleEdit(selectedRow);
              setEditDialogOpen(false);
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="payment_method_id" className="text-gray-400">
                  Payment Method
                </label>
                <Select
                  value={selectedRow?.payment_method_id?.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedRow({
                      ...selectedRow,
                      payment_method_id: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                    {paymentMethods.find(
                      (method) => method.id === selectedRow?.payment_method_id
                    )?.name || "Select Payment Method"}
                  </SelectTrigger>
                  <SelectContent className="bg-white border w-[90%] !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                    {paymentMethods.map((method) => (
                      <SelectItem
                        className="text-bg-primary !ps-3"
                        key={method.id}
                        value={method.id.toString()}
                      >
                        {method.id} - {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="package_id" className="text-gray-400">
                  Package
                </label>
                <Select
                  value={selectedRow?.package_id?.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedRow({
                      ...selectedRow,
                      package_id: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                    {getPackagesByType(selectedRow?.type).find(
                      (pkg) => pkg.id === selectedRow?.package_id
                    )?.name || "Select Package"}
                  </SelectTrigger>
                  <SelectContent className="bg-white border w-[90%] !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                    {getPackagesByType(selectedRow?.type).map((pkg) => (
                      <SelectItem
                        className="text-bg-primary !ps-3"
                        key={pkg.id}
                        value={pkg.id.toString()}
                      >
                        {pkg.id} - {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRow?.type === "provider" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="service_id" className="text-gray-400">
                      Service
                    </label>
                    <Select
                      value={selectedRow?.service_id?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedRow({
                          ...selectedRow,
                          service_id: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                        {services.find(
                          (service) => service.id === selectedRow?.service_id
                        )?.name || "Select Service"}
                      </SelectTrigger>
                      <SelectContent className="bg-white border w-[90%] !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {services.map((service) => (
                          <SelectItem
                            className="text-bg-primary !ps-3"
                            key={service.id}
                            value={service.id.toString()}
                          >
                            {service.id} - {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedRow?.type === "village" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="village_id" className="text-gray-400">
                      Village
                    </label>
                    <Select
                      value={selectedRow?.village_id?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedRow({
                          ...selectedRow,
                          village_id: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                        {villages.find(
                          (village) => village.id === selectedRow?.village_id
                        )?.name || "Select Village"}
                      </SelectTrigger>
                      <SelectContent className="bg-white border w-[90%] !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {villages.map((village) => (
                          <SelectItem
                            className="text-bg-primary !ps-3"
                            key={village.id}
                            value={village.id.toString()}
                          >
                            {village.id} - {village.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </EditDialog>

          <DeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            selectedRow={selectedRow}
            onDelete={() => {
              handleDelete(selectedRow);
              setDeleteDialogOpen(false);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}