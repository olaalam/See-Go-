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
  const [positions, setPositions] = useState([]); // Add positions state
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
  const [permissions, setPermissions] = useState([]); // State for permissions

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });
  // الحصول على الصلاحيات من localStorage
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

  // التحقق من وجود صلاحية معينة
  const hasPermission = (permission) => {
    const match = permission.match(/^Admin(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Admin:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);
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

      // Store positions data
      if (result.position && Array.isArray(result.position)) {
        setPositions(result.position);
      }

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

        // Find position name
        const position = result.position?.find(
          (pos) => pos.id === admin.admin_position_id
        );
        const positionName = position ? position.name : "—";

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
          admin_position_id: admin.admin_position_id,
          position_name: positionName,
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
      if (isRolesDropdownOpen && !event.target.closest(".roles-dropdown")) {
        setIsRolesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("AdminEdit")) {
      toast.error("You don't have permission to edit zones");
      return;
    }
    const {
      id,
      name,
      phone,
      email,
      admin_position_id,
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
    formData.append("gender", gender || "");
    formData.append("status", status === "active" ? 1 : 0);
    formData.append("admin_position_id", admin_position_id);

    // إضافة كلمة المرور فقط إذا تم إدخالها
    if (password && password.trim() !== "") {
      formData.append("password", password);
    }

    // إضافة الأدوار المحددة للـ Provider (check if position type is provider)
    const selectedPosition = positions.find(
      (pos) => pos.id === admin_position_id
    );
    if (selectedPosition?.type === "provider" && selectedEditRoles.length > 0) {
      selectedEditRoles.forEach((roleItem) => {
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
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("AdminDelete")) {
      toast.error("You don't have permission to delete zones");
      return;
    }
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
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("AdminStatus")) {
      toast.error("You don't have permission to change zone status");
      return;
    }

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
      key: "position_name",
      label: "Position",
      render: (row) => row?.position_name || "—",
    },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
    { key: "gender", label: "Gender" },
  ];

  // Update filter options to use positions
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
      key: "position_name",
      label: "Position",
      options: [
        { value: "all", label: "All Positions" },
        ...positions.map((position) => ({
          value: position.name,
          label: position.name,
        })),
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
        showAddButton={hasPermission("AdminAdd")} // هذا يتحكم في إرسال الـ prop من الأساس
        addRoute="/admin/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={hasPermission("AdminEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
        showDeleteButton={hasPermission("AdminDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
        showActions={hasPermission("AdminEdit") || hasPermission("AdminDelete")}
        searchKeys={["name", "phone", "email"]}
        filterKey={["status", "position_name"]}
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

              <label htmlFor="position" className="text-gray-400 !pb-3">
                Position
              </label>
              <Select
                value={selectedRow?.admin_position_id?.toString()}
                onValueChange={(value) => {
                  const positionId = parseInt(value);
                  onChange("admin_position_id", positionId);

                  // Clear roles if switching away from provider position
                  const selectedPosition = positions.find(
                    (pos) => pos.id === positionId
                  );
                  if (selectedPosition?.type !== "provider") {
                    setSelectedEditRoles([]);
                  }
                }}
              >
                <SelectTrigger
                  id="position"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {positions.map((position) => (
                    <SelectItem
                      key={position.id}
                      value={position.id.toString()}
                      className="text-bg-primary"
                    >
                      {position.name}
                    </SelectItem>
                  ))}
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

              {/* Provider Roles Section - Only show if position type is provider */}
              {(() => {
                const selectedPosition = positions.find(
                  (pos) => pos.id === selectedRow?.admin_position_id
                );
                return (
                  selectedPosition?.type === "provider" && (
                    <div className="w-full mt-4">
                      <label
                        htmlFor="providerRoles"
                        className="text-gray-400 mb-2 block"
                      >
                        Assign Modules
                      </label>

                      {/* Role Selection Input */}
                      <Select value="" onValueChange={handleEditRoleChange}>
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
                              className={`${
                                selectedEditRoles.includes(roleModule)
                                  ? "bg-gray-100 font-semibold"
                                  : ""
                              }`}
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
                  )
                );
              })()}
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
              <p className="text-center text-gray-500">
                No roles assigned to this provider.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admins;
