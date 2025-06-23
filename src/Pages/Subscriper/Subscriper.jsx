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
import { useNavigate } from "react-router-dom";

export default function SubscribersPage() {
  const [tab, setTab] = useState("provider");
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
  const [maintenanceProviders, setMaintenanceProviders] = useState([]);
  const [maintenancePackages, setMaintenancePackages] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]); // Changed from 'services' to 'serviceTypes'
  const token = localStorage.getItem("token");
  const [permissions, setPermissions] = useState([]);
  const navigate = useNavigate();

  // Get permissions from localStorage
  const getUserPermissions = () => {
    try {
      const permissions = localStorage.getItem("userPermission");
      const parsed = permissions ? JSON.parse(permissions) : [];

      const flatPermissions = parsed.map(
        (perm) => `${perm.module}:${perm.action}`
      );
      console.log("Flattened permissions:", flatPermissions);
      return flatPermissions;
    } catch (error) {
      console.error("Error parsing user permissions:", error);
      return [];
    }
  };

  const handleAddClick = () => {
    navigate("/subscribers/add", { state: { initialType: tab } });
  };

  // Check for specific permission
  const hasPermission = (permission) => {
    const match = permission.match(/^subcriber(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `subcriber:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

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
        case "provider":
          result = response.data.subscribers_provider.map((sub) => ({
            ...sub,
            type: "provider",
          }));
          break;
        case "village":
          result = response.data.subscribers_village.map((sub) => ({
            ...sub,
            type: "village",
          }));
          break;
        case "maintenance_provider":
          result =
            response.data.subscribers_maintenance_provider?.map((sub) => ({
              ...sub,
              type: "maintenance_provider",
            })) || [];
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
      setMaintenanceProviders(response.data.maintenance_provider || []);
      setMaintenancePackages(response.data.maintenance_provider_packages || []);
      // *** IMPORTANT FIX HERE ***
      // setServiceTypes to the full array of service_type objects
      setServiceTypes(response.data.service_type || []);
      console.log("Fetched Service Types:", response.data.subscribers_provider.service); // For debugging

      console.log(
        "Maintenance Providers (from API data.maintenance_provider):",
        response.data.maintenance_provider
      );
      console.log("Response data keys:", Object.keys(response.data));
    } catch (error) {
      toast.error("Failed to fetch subscribers.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]); // Dependency on tab to refetch data when tab changes

  const handleEdit = async (row) => {
    console.log("handleEdit: Row data being sent to API:", row);

    const formData = new FormData();
    formData.append(
      "payment_method_id",
      row.payment_method_id?.toString() || ""
    );
    formData.append("package_id", row.package_id?.toString() || "");
    formData.append("type", row.type);

    if (row.type === "provider") {
      formData.append("provider_id", row?.provider_id?.toString() || "");
      // Use service_id, not service_type_id if the backend expects service_id
      formData.append("service_id", row?.service_id?.toString() || "");
    } else if (row.type === "village") {
      formData.append("village_id", row?.village_id?.toString() || "");
    } else if (row.type === "maintenance_provider") {
      formData.append(
        "maintenance_provider_id",
        row?.maintenance_provider_id?.toString() || ""
      );
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
      console.error(
        "Error updating subscriber:",
        error.response?.data || error.message
      );
      toast.error(
        `Failed to update subscriber: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDelete = async (row) => {
    console.log("handleDelete: Row data being deleted:", row);
    try {
      await axios.delete(
        `https://bcknd.sea-go.org/admin/subscriper/delete/${row.id}`,
        { headers: getAuthHeaders() }
      );
      toast.success("Subscriber deleted successfully.");
      setData((prevData) => prevData.filter((item) => item.id !== row.id));
    } catch (error) {
      console.error(
        "Error deleting subscriber:",
        error.response?.data || error.message
      );
      toast.error(
        `Failed to delete subscriber: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Function to get Payment Method Name
  const getPaymentMethodName = (row) => {
    if (row.payment_method_item?.name) {
      return row.payment_method_item.name;
    }

    if (row.payment_method?.name) {
      return row.payment_method.name;
    }

    if (row.paymentMethod?.name) {
      return row.paymentMethod.name;
    }

    if (row.payment_method_name) {
      return row.payment_method_name;
    }

    if (row.payment_method_id) {
      const method = paymentMethods.find((m) => m.id === row.payment_method_id);
      if (method) return method.name;
    }

    if (typeof row.payment_method === "string") {
      return row.payment_method;
    }

    return "N/A";
  };

  const handleEditClick = (row) => {
    const rowToEdit = { ...row };

    if (!rowToEdit.type) {
      rowToEdit.type = tab;
    }

    // Fix payment_method_id
    if (rowToEdit.payment_method_id === undefined) {
      if (rowToEdit.payment_method_item?.id !== undefined) {
        rowToEdit.payment_method_id = rowToEdit.payment_method_item.id;
      } else if (rowToEdit.payment_method?.id !== undefined) {
        rowToEdit.payment_method_id = rowToEdit.payment_method.id;
      } else if (rowToEdit.paymentMethod?.id !== undefined) {
        rowToEdit.payment_method_id = rowToEdit.paymentMethod.id;
      }
    }

    // Ensure package_id is set if available
    if (rowToEdit.package_id === undefined && rowToEdit.package?.id !== undefined) {
      rowToEdit.package_id = rowToEdit.package.id;
    } else if (rowToEdit.package_id === null) {
      rowToEdit.package_id = undefined;
    }

    if (rowToEdit.type === "provider") {
      if (rowToEdit.provider_id === undefined && rowToEdit.provider?.id !== undefined) {
        rowToEdit.provider_id = rowToEdit.provider.id;
      }
      // *** IMPORTANT: Correctly extract service_id for provider type ***
      // Check for service_id directly on the row, or nested within 'service' or 'service_name' objects
      if (rowToEdit.service_id === undefined) {
          if (row.service_id !== undefined && row.service_id !== null) { // Check top-level service_id
              rowToEdit.service_id = row.service_id;
          } else if (rowToEdit.service?.id !== undefined) {
              rowToEdit.service_id = rowToEdit.service.id;
          } else if (rowToEdit.service_name?.id !== undefined) {
              rowToEdit.service_id = rowToEdit.service_name.id;
          }
      }
      console.log("handleEditClick - provider service_id:", rowToEdit.service_id); // Debugging
    } else if (rowToEdit.type === "village") {
      if (rowToEdit.village_id === undefined && rowToEdit.village?.id !== undefined) {
        rowToEdit.village_id = rowToEdit.village.id;
      }
    } else if (rowToEdit.type === "maintenance_provider") {
      if (rowToEdit.maintenance_provider_id === undefined) {
        if (rowToEdit.maintenance_provider?.id !== undefined) {
          rowToEdit.maintenance_provider_id = rowToEdit.maintenance_provider.id;
        } else if (rowToEdit.maintenanceProvider?.id !== undefined) {
          rowToEdit.maintenance_provider_id = rowToEdit.maintenanceProvider.id;
        }
      }
    }

    console.log("Selected row for edit (final):", rowToEdit);
    setSelectedRow(rowToEdit);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (row) => {
    console.log("handleDelete: Row data being deleted:", row);
    setSelectedRow({ ...row, name: row.subscriber });
    setDeleteDialogOpen(true);
  };

  const getPackagesByType = (type) => {
    if (type === "provider") return providerPackages;
    if (type === "village") return villagePackages;
    if (type === "maintenance_provider") return maintenancePackages;
    return [];
  };

  const filterOptionsForZones = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  const columns = [
    {
      key: "subscriber",
      label: "Subscriber Name",
      render: (row) => row.subscriber || row.name || "N/A",
    },
    {
      key: "type",
      label: "Type",
      render: (row) => row.type || "N/A",
    },
    {
      key: "date",
      label: "Date",
      render: (row) => row.start_date || row.date || "N/A",
    },
    {
      key: "payment_method",
      label: "Payment Method",
      render: (row) => getPaymentMethodName(row),
    },
    {
      key: "expiry_date",
      label: "Expiry Date",
      render: (row) => row.expire_date || row.expiry_date || "N/A",
    },
    {
      key: "package",
      label: "Package",
      render: (row) => {
        if (row.package?.name) return row.package.name;
        if (row.packageName) return row.packageName;
        if (row.package_name) return row.package_name;

        if (row.package_id) {
          const packages = getPackagesByType(row.type);
          const pkg = packages.find((p) => p.id === row.package_id);
          if (pkg) return pkg.name;
        }

        return "N/A";
      },
    },
    {
      key: "price",
      label: "Price",
      render: (row) => {
        if (row.package?.price) return row.package.price;
        if (row.price) return row.price;

        if (row.package_id) {
          const packages = getPackagesByType(row.type);
          const pkg = packages.find((p) => p.id === row.package_id);
          if (pkg && pkg.price) return pkg.price;
        }

        return "N/A";
      },
    },
    ...(tab === "provider"
 ? [
  {
  key: "service_type", // Changed key for clarity
  label: "Services Type",
  render: (row) => {
 if (row.type === "village") return "-"; // Villages don't have service types

 // 1. Check if 'service_item' object exists with a name (most detailed from your JSON)
 if (row.service_item?.name) {
 return row.service_item.name;
 }

 // 2. Check if 'service' is directly a string (as seen in your JSON example)
 if (typeof row.service === "string") {
 return row.service;
 }

 // 3. Fallback to other nested objects if they contain a name
 if (row.service?.name) return row.service.name;
 if (row.service_name?.name) return row.service_name.name;
 if (row.serviceName) return row.serviceName;

 // 4. Finally, use serviceTypes array to find the name by ID if available
 if (row.service_id) {
 const service = serviceTypes.find((s) => s.id === row.service_id);
 if (service) return service.name;
 }

 return "N/A";
  },
  },
 ]
 : []),
    ...(tab === "maintenance_provider"
      ? [
          {
            key: "maintenance_provider",
            label: "Maintenance Provider",
            render: (row) => {
              if (row.maintenance_provider?.name) {
                return row.maintenance_provider.name;
              }

              if (row.maintenanceProvider?.name) {
                return row.maintenanceProvider.name;
              }

              if (row.maintenance_provider_name) {
                return row.maintenance_provider_name;
              }

              if (row.maintenance_provider_id) {
                const provider = maintenanceProviders.find(
                  (p) => p.id === row.maintenance_provider_id
                );
                if (provider) return provider.name;
              }

              return "N/A";
            },
          },
        ]
      : []),
  ];

  return (
    <div>
      <ToastContainer />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid !ms-3 w-[90%] grid-cols-3 gap-4 bg-transparent !mb-6">
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
            value="maintenance_provider"
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
              showAddButton={hasPermission("subcriberAdd")}
              onAdd={handleAddClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              searchKeys={["type", "subscriber", "payment_method"]}
              filterKey={["status"]}
              showEditButton={hasPermission("subcriberEdit")}
              showDeleteButton={hasPermission("subcriberDelete")}
              showActions={
                hasPermission("subcriberEdit") ||
                hasPermission("subcriberDelete")
              }
              showFilter={false}
              filterOptions={filterOptionsForZones}
            />
          )}

          <EditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            selectedRow={selectedRow}
            onSave={() => {
              if (selectedRow) {
                handleEdit(selectedRow);
              } else {
                toast.error("No row selected for edit.");
              }
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
                    {selectedRow?.payment_method_id
                      ? paymentMethods.find(
                          (method) => method.id === selectedRow?.payment_method_id
                        )?.name || "Select Payment Method"
                      : "Select Payment Method"}
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
                    {selectedRow?.package_id
                      ? getPackagesByType(selectedRow?.type).find(
                          (pkg) => pkg.id === selectedRow?.package_id
                        )?.name || "Select Package"
                      : "Select Package"}
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
                      Service Type {/* Updated label text */}
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
                        {selectedRow?.service_id
                          ? serviceTypes.find( // Used 'serviceTypes'
                              (serviceType) => serviceType.id === selectedRow?.service_id // 'serviceType' for clarity
                            )?.name || "Select Service Type"
                          : "Select Service Type"}
                      </SelectTrigger>
                      <SelectContent className="bg-white border w-[90%] !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {serviceTypes.map((serviceType) => ( // Used 'serviceTypes'
                          <SelectItem
                            className="text-bg-primary !ps-3"
                            key={serviceType.id}
                            value={serviceType.id.toString()}
                          >
                            {serviceType.id} - {serviceType.name}
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
                        {selectedRow?.village_id
                          ? villages.find(
                              (village) => village.id === selectedRow?.village_id
                            )?.name || "Select Village"
                          : "Select Village"}
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

              {/* Improved Maintenance Provider field */}
              {selectedRow?.type === "maintenance_provider" && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="maintenance_provider_id" className="text-gray-400">
                      Maintenance Provider
                    </label>
                    <Select
                      value={selectedRow?.maintenance_provider_id?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedRow({
                          ...selectedRow,
                          maintenance_provider_id: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                        {selectedRow?.maintenance_provider_id
                          ? maintenanceProviders.find(
                              (provider) =>
                                provider.id === selectedRow?.maintenance_provider_id
                            )?.name || "Select Maintenance Provider"
                          : "Select Maintenance Provider"}
                      </SelectTrigger>
                      <SelectContent className="bg-white border w-[90%] !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                        {maintenanceProviders.length > 0 ? (
                          maintenanceProviders.map((provider) => (
                            <SelectItem
                              className="text-bg-primary !ps-3"
                              key={provider.id}
                              value={provider.id.toString()}
                            >
                              {provider.id} - {provider.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-gray-400 p-2">
                            No maintenance providers available
                          </div>
                        )}
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
              if (selectedRow) {
                handleDelete(selectedRow);
              } else {
                toast.error("No row selected for delete.");
              }
              setDeleteDialogOpen(false);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}