import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@radix-ui/react-label";

const Admins = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [admins, setAdmins] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isViewRolesOpen, setIsViewRolesOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allAvailableRoles, setAllAvailableRoles] = useState([]);
  const [selectedEditRoles, setSelectedEditRoles] = useState([]);
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fetchAdmins = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/admins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      // معالجة الأدوار المتاحة - فلترة "all" إذا وجدت
      const filteredActions = result.actions
        ? result.actions.filter((action) => action !== "all")
        : [];
      setAllAvailableRoles(filteredActions);

      // معالجة بيانات الأدمن
      const formatted = (result.admins || []).map((admin) => {
        const translations = (admin.translations || []).reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || admin.name || "—";
        const email = translations[currentLang]?.email || admin.email || "—";
        const phone = translations[currentLang]?.phone || admin.phone || "—";

        const image =
          admin?.image_link && !imageErrors[admin.id] ? (
            <img
              src={admin.image_link}
              alt={name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(admin.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          );

        return {
          id: admin.id,
          name,
          email,
          role: admin.provider_only,
          phone,
          img: image,
          status: admin.status === 1 ? "active" : "inactive",
          image_link: admin.image_link,
          gender: admin.gender || "—",
          super_roles: admin.super_roles || [],
        };
      });

      setAdmins(formatted);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins!");
    } finally {
      dispatch(hideLoader());
    }
  };

  // إغلاق الـ dropdown عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isRolesDropdownOpen && !event.target.closest('.roles-dropdown')) {
        setIsRolesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRolesDropdownOpen]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleEdit = (admin) => {
    setSelectedRow(admin);
    // تحديد الأدوار الحالية للـ admin
    const currentRoles = admin.super_roles
      ? admin.super_roles.map((super_role) => super_role.action || super_role)
      : [];
    setSelectedEditRoles(currentRoles);
    setIsEditOpen(true);
  };

  const handleDelete = (admin) => {
    setSelectedRow(admin);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    
    const {
      id,
      name,
      phone,
      email,
      role,
      status,
      gender,
      password,
      imageFile,
    } = selectedRow;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !phone) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("provider_only", role ? 1 : 0);
    formData.append("gender", gender || "");
    formData.append("status", status === "active" ? 1 : 0);
    
    // إضافة كلمة المرور فقط إذا تم إدخالها
    if (password && password.trim() !== "") {
      formData.append("password", password);
    }

    // إضافة الأدوار المحددة للـ Provider
    if (role === 1 && selectedEditRoles.length > 0) {
      // جرب هذه الطرق بالترتيب حسب ما يتوقعه الـ API

      selectedEditRoles.forEach(roleItem => {
        formData.append("action[]", roleItem);
       });
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admins/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Admin updated successfully!");
         await fetchAdmins();
        setIsEditOpen(false);
        setSelectedRow(null);
        setSelectedEditRoles([]);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update admin!");
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Error occurred while updating admin!");
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admins/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Admin deleted successfully!");
        setAdmins(admins.filter((admin) => admin.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete admin!");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Error occurred while deleting admin!");
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleViewRoles = (row) => {
    setSelectedRoles(row.super_roles || []);
    setIsViewRolesOpen(true);
  };

  const handleEditRoleChange = (roleModule) => {
    setSelectedEditRoles((prevSelectedRoles) => {
      if (prevSelectedRoles.includes(roleModule)) {
        return prevSelectedRoles.filter((module) => module !== roleModule);
      } else {
        return [...prevSelectedRoles, roleModule];
      }
    });
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    dispatch(showLoader());
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admins/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Admin status updated successfully!");
        setAdmins((prevAdmins) =>
          prevAdmins.map((admin) =>
            admin.id === id
              ? { ...admin, status: newStatus === 1 ? "active" : "inactive" }
              : admin
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update admin status:", errorData);
        toast.error(errorData.message || "Failed to update admin status!");
      }
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Error occurred while updating admin status!");
    } finally {
      dispatch(hideLoader());
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => (row.role === 1 ? "Provider" : "Admin"),
    },
    {
      key: "assigned_roles",
      label: "Provider Roles",
      render: (row) => {
        if (row.role === 1 && row.super_roles && row.super_roles.length > 0) {
          return (
            <Button
              variant="outline"
              size="sm"
              className="!px-3 !py-2 text-bg-primary cursor-pointer hover:bg-gray-200 transition-all"
              onClick={() => handleViewRoles(row)}
            >
              View Roles ({row.super_roles.length})
            </Button>
          );
        } else if (row.role === 1) {
          return (
            <span className="text-gray-500 text-sm">No roles assigned</span>
          );
        } else {
          return <span className="text-gray-400 text-sm">—</span>;
        }
      },
    },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
    { key: "gender", label: "Gender" },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    {
      key: "role",
      label: "Role",
      options: [
        { value: "all", label: "All Roles" },
        { value: "0", label: "Admin" },
        { value: "1", label: "Provider" },
      ],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={admins}
        columns={columns}
        addRoute="/admin/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "phone", "email"]}
        filterKey={["status", "role"]}
        filterOptions={filterOptions}
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            columns={columns}
            onChange={onChange}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <label htmlFor="name" className="text-gray-400 !pb-3">
                Name 
              </label>
              <Input
                id="name"
                value={selectedRow?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
                required
              />
              
              <label htmlFor="email" className="text-gray-400 !pb-3">
                Email 
              </label>
              <Input
                id="email"
                type="email"
                value={selectedRow?.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
                required
              />
              
              <label htmlFor="role" className="text-gray-400 !pb-3">
                Role 
              </label>
              <Select
                value={selectedRow?.role?.toString()}
                onValueChange={(value) => {
                  onChange("role", parseInt(value));
                  // مسح الأدوار المحددة عند تغيير النوع من Provider إلى Admin
                  if (parseInt(value) === 0) {
                    setSelectedEditRoles([]);
                  }
                }}
              >
                <SelectTrigger
                  id="role"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  <SelectItem value="0" className="text-bg-primary">
                    Admin
                  </SelectItem>
                  <SelectItem value="1" className="text-bg-primary">
                    Provider
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <label htmlFor="phone" className="text-gray-400 !pb-3">
                Phone 
              </label>
              <Input
                id="phone"
                value={selectedRow?.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
                required
              />
              
              <label htmlFor="password" className="text-gray-400 !pb-3">
                Password 
              </label>
              <Input
                id="password"
                type="password"
                value={selectedRow?.password || ""}
                onChange={(e) => onChange("password", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
                placeholder="password "
              />
              
              <label htmlFor="gender" className="text-gray-400 !pb-3">
                Gender
              </label>
              <Select
                value={selectedRow?.gender || ""}
                onValueChange={(value) => onChange("gender", value)}
              >
                <SelectTrigger
                  id="gender"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[8px]"
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  <SelectItem value="male" className="text-bg-primary">
                    Male
                  </SelectItem>
                  <SelectItem value="female" className="text-bg-primary">
                    Female
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Provider Roles Section */}
{/* Provider Roles Section - Updated Design */}
              {selectedRow?.role === 1 && (
                <div className="w-full mt-4">
                  <label htmlFor="providerRoles" className="text-gray-400 mb-2 block">
                    Assign Modules
                  </label>

                  {/* Role Selection Input */}
                  <Select
                    value=""
                    onValueChange={handleEditRoleChange}
                  >
                    <SelectTrigger
                      id="providerRoles"
                      className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary rounded-[10px]"
                    >
                      <SelectValue placeholder="Select modules" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                      {allAvailableRoles.map((roleModule) => (
                        <SelectItem
                          key={roleModule}
                          value={roleModule}
                          className={`${selectedEditRoles.includes(roleModule) ? 'bg-gray-100 font-semibold' : ''}`}
                        >
                          {roleModule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Display Currently Selected Roles */}
                  {selectedEditRoles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Currently assigned: {selectedEditRoles.join(", ")}
                    </div>
                  )}
                  {selectedEditRoles.length === 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      No modules assigned.
                    </div>
                  )}
                </div>
              )}
            </div>
          </EditDialog>
          
          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            selectedRow={selectedRow}
          />
        </>
      )}

      {/* Roles View Modal */}
      <Dialog open={isViewRolesOpen} onOpenChange={setIsViewRolesOpen}>
        <DialogContent className="bg-white !mb-4 !p-6 rounded-lg shadow-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">
              Assigned Roles
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {selectedRoles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedRoles.map((super_role, index) => (
                  <div
                    key={index}
                    className="!p-3 !m-1 border rounded-md bg-gray-50 dark:bg-gray-300 text-center"
                  >
                    {super_role.action || super_role || "N/A"}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No roles assigned to this provider.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admins;