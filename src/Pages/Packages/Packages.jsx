// ملف Subscription.js - الكود الكامل معدل
"use client";

import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FooterInvoiceImage from "@/assets/FooterInvoice.png";
import { Plus, Trash } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Subscription = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [subscriptions, setSubscriptions] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // إضافة useSearchParams لقراءة tab من URL
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'provider';
  const [tab, setTab] = useState(currentTab);
  
  const token = localStorage.getItem("token");
  const [permissions, setPermissions] = useState([]);

  // State for search and filter
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const navigate = useNavigate();

  // تحديث URL عند تغيير التاب
  useEffect(() => {
    setSearchParams({ tab });
  }, [tab, setSearchParams]);

  // Define filter options
  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Get user permissions from localStorage
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

  // Check if user has specific permission
  const hasPermission = (action) => {
    // Map subscription actions to the correct permission format
    const permissionMap = {
      'add': 'Subscription:add',
      'edit': 'Subscription:edit', 
      'delete': 'Subscription:delete',
      'status': 'Subscription:status',
      'view': 'Subscription:view'
    };

    const requiredPermission = permissionMap[action.toLowerCase()];
    const hasAccess = permissions.includes(requiredPermission);
    
    console.log(`Checking permission for ${action}:`, {
      requiredPermission,
      hasAccess,
      allPermissions: permissions
    });
    
    return hasAccess;
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  // Check view permission early
  useEffect(() => {
    if (permissions.length > 0 && !hasPermission('view')) {
      toast.error("You don't have permission to view subscriptions");
      navigate('/dashboard'); // Redirect to dashboard or appropriate page
      return;
    }
  }, [permissions, navigate]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchServices = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/service_type", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const formattedServices = (result.service_types || []).map((service) => {
        const currentLang = localStorage.getItem("lang") || "en";
        const name =
          service.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value || service.name;
        return {
          id: service.id,
          name,
        };
      });
      setServices(formattedServices);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchSubscriptions = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/subscription",
        {
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = (result.packages || []).map((subscription) => {
        const translations = subscription.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name =
          translations[currentLang]?.name || subscription.name || "—";
        const type =
          translations[currentLang]?.type || subscription.type || "—";
        const description =
          translations[currentLang]?.description ||
          subscription.description ||
          "—";
        const serviceName =
          subscription.service?.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value ||
          subscription.service?.name ||
          "—";

        const price = subscription.price || "—";
        const discount = subscription.discount || "—";
        const feez = subscription.feez || "—";
        const admin_num = subscription.admin_num;
        const security_num = subscription.security_num || "—";
        const maintenance_module = subscription.maintenance_module;
        const beach_pool_module = subscription.beach_pool_module;
        const average =
          subscription.feez && subscription.discount
            ? (subscription.feez * (1 - subscription.discount / 100)) : "-";
        return {
          id: subscription.id,
          name,
          type,
          description,
          status: subscription.status === 1 ? "Active" : "Inactive",
          service_id: subscription.service_id,
          serviceName,
          admin_num,
          security_num,
          maintenance_module,
          beach_pool_module,
          price,
          discount,
          feez,
          average,
        };
      });

      setSubscriptions(formatted);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchSubscriptions(), fetchServices()]);
    };
    fetchData();
  }, []);

  // Filter and search subscriptions based on the selected tab, search value, and filter value
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    // Tab filtering
    let tabMatch = true;
    if (tab === "provider") {
      tabMatch = subscription.type === "provider";
    } else if (tab === "village") {
      tabMatch = subscription.type === "village";
    } else if (tab === "maintenance") {
      tabMatch =
        subscription.type === "maintenance_provider" && subscription.maintenance_module;
    }

    // Search filtering
    const searchMatch = subscription.name
      .toLowerCase()
      .includes(searchValue.toLowerCase());

    // Status filtering
    let statusMatch = true;
    if (filterValue === "active") {
      statusMatch = subscription.status === "Active";
    } else if (filterValue === "inactive") {
      statusMatch = subscription.status === "Inactive";
    }

    return tabMatch && searchMatch && statusMatch;
  });

  const handleEdit = async (subscription) => {
    if (!hasPermission('edit')) {
      toast.error("You don't have permission to edit subscriptions");
      return;
    }
    
    if (services.length === 0) {
      await fetchServices();
    }
    setSelectedRow({
      ...subscription,
      service_id: subscription.service_id ?? subscription.service?.id ?? "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (subscription) => {
    if (!hasPermission('delete')) {
      toast.error("You don't have permission to delete subscriptions");
      return;
    }
    
    setSelectedRow(subscription);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!hasPermission('edit')) {
      toast.error("You don't have permission to edit subscriptions");
      return;
    }

    const {
      id,
      name,
      type,
      description,
      status,
      discount,
      service_id,
      price,
      feez,
    } = selectedRow;

    // Only check service_id if type is provider
    if (type === "provider" && (!service_id || isNaN(service_id))) {
      toast.error("Service ID is required for provider type");
      return;
    }

    const updatedSubscription = new FormData();
    updatedSubscription.append("id", id);
    updatedSubscription.append("name", name || "");
    updatedSubscription.append("feez", feez || "");
    updatedSubscription.append("description", description || "");
    updatedSubscription.append("status", status === "Active" ? "1" : "0");
    updatedSubscription.append("price", price || "");
    updatedSubscription.append("type", type || "");
    updatedSubscription.append("discount", discount || "");

    // Add service_id only if type = provider
    if (type === "provider") {
      updatedSubscription.append("service_id", service_id);
    }

    if (type === "village") {
      updatedSubscription.append("admin_num", selectedRow.admin_num || "0");
      updatedSubscription.append(
        "security_num",
        selectedRow.security_num || "0"
      );
      updatedSubscription.append(
        "maintenance_module",
        selectedRow.maintenance_module ? "1" : "0"
      );
      updatedSubscription.append(
        "beach_pool_module",
        selectedRow.beach_pool_module ? "1" : "0"
      );
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/subscription/update/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updatedSubscription,
        }
      );

      if (response.ok) {
        toast.success("Subscription updated successfully!");
        await fetchSubscriptions();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to update subscription!");
      }
    } catch (error) {
      toast.error("Error occurred while updating subscription!", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!hasPermission('delete')) {
      toast.error("You don't have permission to delete subscriptions");
      return;
    }
    
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/subscription/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Subscription deleted successfully!");
        setSubscriptions(
          subscriptions.filter(
            (subscription) => subscription.id !== selectedRow.id
          )
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete subscription!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting subscription!", error);
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]:
        key === "service_id"
          ? parseInt(value, 10)
          : key === "type"
          ? value.toLowerCase()
          : value,
    }));
  };

  const handleToggleStatus = async (row, newStatus) => {
    if (!hasPermission('status')) {
      toast.error("You don't have permission to change subscription status");
      return;
    }

    const { id } = row;
    
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/subscription/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Subscription status updated successfully!");
        setSubscriptions((prevSubscriptions) =>
          prevSubscriptions.map((subscription) =>
            subscription.id === id
              ? {
                  ...subscription,
                  status: newStatus === 1 ? "Active" : "Inactive",
                }
              : subscription
          )
        );
      } else {
        toast.error("Failed to update subscription status!");
      }
    } catch (error) {
      toast.error("Error occurred while updating subscription status!", error);
    }
  };

  // التعديل الجديد - تمرير نوع التاب مع الرابط مع التاب الحالي
  const onAdd = () => {
    if (!hasPermission('add')) {
      toast.error("You don't have permission to add subscriptions");
      return;
    }
    
    // تحديد نوع الاشتراك بناءً على التاب المختار
    let subscriptionType = '';
    if (tab === 'provider') {
      subscriptionType = 'provider';
    } else if (tab === 'village') {
      subscriptionType = 'village';
    } else if (tab === 'maintenance') {
      subscriptionType = 'maintenance_provider';
    }
    
    // تمرير النوع والتاب الحالي كمعاملات في الرابط
    navigate(`/packages/add?type=${subscriptionType}&returnTab=${tab}`);
  };

  // Permission-based UI controls
  const showAddButton = hasPermission('add');
  const showFilter = true;
  const selectedRows = [];
  const showDeleteButtonInHeader = false;
  const onDeleteInHeader = (rows) => {
    console.log("Delete selected rows:", rows);
  };

  console.log("Permission checks:", {
    add: hasPermission('add'),
    edit: hasPermission('edit'),
    delete: hasPermission('delete'),
    status: hasPermission('status'),
    view: hasPermission('view')
  });

  // Don't render component if user doesn't have view permission
  if (permissions.length > 0 && !hasPermission('view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg">Access Denied</p>
          <p className="text-gray-600">You don't have permission to view subscriptions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="!p-4">
      {isLoading && <FullPageLoader />}
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
            value="maintenance"
          >
            Maintenance Type
          </TabsTrigger>
        </TabsList>
        <ToastContainer />

        {/* Search, Filter, and Add section */}
        <div className="flex justify-between !mb-6 items-center flex-wrap gap-4">
          <Input
            placeholder="Search..."
            className="w-full md:!ms-3 sm:!ms-0 !ps-3 sm:w-1/3 max-w-sm border-bg-primary focus:border-bg-primary focus:ring-bg-primary rounded-[10px]"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {showFilter && (
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-[120px] border-bg-primary focus:ring-bg-primary rounded-[10px] !px-2">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent className="bg-white border-bg-primary rounded-md shadow-lg !p-3">
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showAddButton && (
                <Button
                  onClick={onAdd}
                  className="bg-bg-primary cursor-pointer text-white hover:bg-teal-700 rounded-[10px] !p-3"
                >
                  <Plus className="w-5 h-5 !mr-2" />
                  Add
                </Button>
              )}
              {showDeleteButtonInHeader && (
                <Button
                  onClick={() => onDeleteInHeader(selectedRows)}
                  className="bg-red-600 cursor-pointer text-white hover:bg-red-700 rounded-[10px] !p-3"
                  disabled={selectedRows.length === 0}
                >
                  <Trash className="w-5 h-5 !mr-2" />
                  Delete Selected
                </Button>
              )}
            </div>
          )}
        </div>
        {/* End of Search, Filter, and Add section */}

        {/* Card Layout for Subscriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => (
            <Card
              key={subscription.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col justify-between min-h-[340px]"
            >
              <CardHeader
                className=" !p-4 flex justify-between items-center"
                style={{
                  backgroundImage: `url(${FooterInvoiceImage})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  color: "white",
                }}
              >
                <div>
                  <CardTitle className="text-xl text-bg-primary font-bold">
                    {subscription.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-bg-primary">
                    {subscription.type}
                  </CardDescription>
                </div>
                {subscription.discount !== "—" && (
                  <span className="bg-gray-300 text-black text-xs font-semibold !px-2 !!py-1 rounded-full">
                    {subscription.discount}% OFF
                  </span>
                )}
              </CardHeader>

              <CardContent className="!p-4 flex-1">
                <p className="text-gray-600 text-sm !mb-2">
                  {subscription.description}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  <span className="line-through text-gray-500 !mr-2">
                    {subscription.feez !== "—"
                      ? `${subscription.feez} EGP`
                      : ""}
                  </span>
                  <span className="text-gray-500">
                    {subscription.average} EGP
                  </span>
                </p>
                <div className="!mt-3 space-y-2">
                  <span className="font-medium text-sm text-gray-700">
                    Annual subscription fees :
                  </span>{" "}
                  {subscription.price} EGP
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Service:</span>{" "}
                    {subscription.serviceName}
                  </p>
                  {subscription.type === "village" && (
                    <>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Admin Number:</span>{" "}
                        {subscription.admin_num}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Security Number:</span>{" "}
                        {subscription.security_num}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Maintenance Module:</span>{" "}
                        {subscription.maintenance_module
                          ? "Enabled"
                          : "Disabled"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Beach/Pool Module:</span>{" "}
                        {subscription.beach_pool_module
                          ? "Enabled"
                          : "Disabled"}
                      </p>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 text-sm">
                      Status:
                    </span>
                    <Switch
                      checked={subscription.status === "Active"}
                      onCheckedChange={(checked) =>
                        handleToggleStatus(subscription, checked ? 1 : 0)
                      }
                      disabled={!hasPermission('status')}
                      className={`${
                        subscription.status === "Active"
                          ? "data-[state=checked]:bg-bg-primary"
                          : "data-[state=unchecked]:bg-gray-500"
                      }`}
                    />
                    <span
                      className={
                        subscription.status === "Active"
                          ? "text-bg-primary text-sm"
                          : "text-red-600 text-sm"
                      }
                    >
                      {subscription.status}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="!p-4 border-t border-gray-200 flex justify-between">
                {hasPermission('edit') && (
                  <Button
                    onClick={() => handleEdit(subscription)}
                    className="bg-bg-primary hover:bg-teal-600 cursor-pointer text-white rounded-lg !px-4 !py-2"
                  >
                    Edit
                  </Button>
                )}
                {hasPermission('delete') && (
                  <Button
                    onClick={() => handleDelete(subscription)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg !px-4 !py-2"
                  >
                    Delete
                  </Button>
                )}
                {!hasPermission('edit') && !hasPermission('delete') && (
                  <div className="text-gray-500 text-sm">No actions available</div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </Tabs>

      {/* Edit and Delete Dialogs */}
      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            services={services}
            onChange={onChange}
            className="!p-4"
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Subscription Name
              </label>
              <Input
                label="Subscription Name"
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="type" className="text-gray-400 !pb-3">
                Type
              </label>
              <Select
                value={selectedRow?.type?.toLowerCase() || ""}
                onValueChange={(value) => onChange("type", value)}
              >
                <SelectTrigger
                  id="type"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  <SelectItem value="provider" className="text-bg-primary">
                    Provider
                  </SelectItem>
                  <SelectItem value="village" className="text-bg-primary">
                    Village
                  </SelectItem>
                  <SelectItem value="maintenance_provider" className="text-bg-primary">
                    Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>

              <label htmlFor="description" className="text-gray-400 !pb-3">
                Description
              </label>
              <Input
                label="description"
                id="description"
                value={selectedRow?.description || ""}
                onChange={(e) => onChange("description", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="feez" className="text-gray-400 !pb-3">
                Fees
              </label>
              <Input
                label="feez"
                id="feez"
                value={selectedRow?.feez || ""}
                onChange={(e) => onChange("feez", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              {selectedRow?.type === "village" && (
                <>
                  <label htmlFor="admin_num" className="text-gray-400 !pb-3">
                    Admin Number
                  </label>
                  <Input
                    id="admin_num"
                    value={selectedRow?.admin_num || ""}
                    onChange={(e) => onChange("admin_num", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                  />

                  <label htmlFor="security_num" className="text-gray-400 !pb-3">
                    Security Number
                  </label>
                  <Input
                    id="security_num"
                    value={selectedRow?.security_num || ""}
                    onChange={(e) => onChange("security_num", e.target.value)}
                    className="!my-2 text-bg-primary !p-4"
                  />

                  <label
                    htmlFor="maintenance_module"
                    className="text-gray-400 !pb-3"
                  >
                    Maintenance Module (0 or 1)
                  </label>
                  <Input
                    id="maintenance_module"
                    type="number"
                    min="0"
                    max="1"
                    value={selectedRow?.maintenance_module || ""}
                    onChange={(e) =>
                      onChange("maintenance_module", e.target.value)
                    }
                    className="!my-2 text-bg-primary !p-4"
                  />

                  <label
                    htmlFor="beach_pool_module"
                    className="text-gray-400 !pb-3"
                  >
                    Beach/Pool Module (0 or 1)
                  </label>
                  <Input
                    id="beach_pool_module"
                    type="number"
                    min="0"
                    max="1"
                    value={selectedRow?.beach_pool_module || ""}
                    onChange={(e) =>
                      onChange("beach_pool_module", e.target.value)
                    }
                    className="!my-2 text-bg-primary !p-4"
                  />
                </>
              )}
              <label htmlFor="price" className="text-gray-400 !pb-3">
                Price
              </label>
              <Input
                type="number"
                label="price"
                id="price"
                value={selectedRow?.price || ""}
                onChange={(e) => onChange("price", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="discount" className="text-gray-400 !pb-3">
                Discount
              </label>
              <Input
                type="number"
                label="discount"
                id="discount"
                value={selectedRow?.discount || ""}
                onChange={(e) => onChange("discount", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />

              {selectedRow?.type === "provider" && (
                <>
                  <label htmlFor="service" className="text-gray-400 !pb-3">
                    Service
                  </label>
                  <Select
                    value={selectedRow?.service_id?.toString()}
                    onValueChange={(value) => onChange("service_id", value)}
                    disabled={services.length === 0}
                  >
                    <SelectTrigger
                      id="service"
                      className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                    >
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                      {services.length > 0 ? (
                        services.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                            className="text-bg-primary"
                          >
                            {service.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value={null}
                          className="text-bg-primary"
                          disabled
                        >
                          No services available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </EditDialog>
          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
          />
        </>
      )}
    </div>
  );
};

export default Subscription;