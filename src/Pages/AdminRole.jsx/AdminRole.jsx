import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import RoleForm from "./AdminRoleDialog"; // استيراد الفورم

const Admin_roles = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [Admin_roless, setAdmin_roless] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewRolesOpen, setIsViewRolesOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allAvailableRoles, setAllAvailableRoles] = useState({});
  const [permissions, setPermissions] = useState([]); // State for permissions

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
    const match = permission.match(/^Admin Role(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Admin Role:${permKey}`;

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

  const fetchAdmin_roless = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch(
        "https://bcknd.sea-go.org/admin/admin_role",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      setAllAvailableRoles(result.roles || {});

      const formatted = result.admin_position.map((adminPosition) => {
        const translations = Array.isArray(adminPosition.translations)
          ? adminPosition.translations.reduce((acc, t) => {
              if (!acc[t.locale]) acc[t.locale] = {};
              acc[t.locale][t.key] = t.value;
              return acc;
            }, {})
          : {};

        const name =
          translations[currentLang]?.name || adminPosition.name || "—";

        let roleToDisplay = "";
        if (
          Array.isArray(adminPosition.sup_roles) &&
          adminPosition.sup_roles.length > 0
        ) {
          const uniqueModules = [
            ...new Set(
              adminPosition.sup_roles.map((roleObj) => roleObj.module)
            ),
          ];
          roleToDisplay = uniqueModules.join(", ");
        } else {
          roleToDisplay = "No Roles Assigned";
        }

        return {
          id: adminPosition.id,
          name: name,
          role: roleToDisplay,
          status: adminPosition.status === 1 ? "active" : "inactive",
          sup_roles: adminPosition.sup_roles,
        };
      });

      setAdmin_roless(formatted);
    } catch (error) {
      console.error("Error fetching Admin_roless:", error);
      toast.error("Failed to load Admin roles data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchAdmin_roless();
  }, []);

  const handleEdit = (Admin_roles) => {
    setSelectedRow(Admin_roles);
    setIsEditOpen(true);
  };

  const handleDelete = (Admin_roles) => {
    setSelectedRow(Admin_roles);
    setIsDeleteOpen(true);
  };

  const handleViewRoles = (Admin_roles) => {
    setSelectedRoles(Admin_roles.sup_roles || []);
    setIsViewRolesOpen(true);
  };

  const handleDeleteConfirm = async () => {
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("Admin RoleDelete")) {
      toast.error("You don't have permission to delete Admin Role");
      return;
    }
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admin_role/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Admin role deleted successfully!");
        setAdmin_roless((prev) =>
          prev.filter((Admin_roles) => Admin_roles.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete Admin role!");
      }
    } catch (error) {
      console.error("Error deleting Admin_roles:", error);
      toast.error("Error occurred while deleting Admin role!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("Admin RoleStatus")) {
      toast.error("You don't have permission to change Admin Role status");
      return;
    }
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admin_role/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Admin Role status updated successfully!");
        setAdmin_roless((prev) =>
          prev.map((role) =>
            role.id === id
              ? { ...role, status: newStatus === 1 ? "active" : "inactive" } // Ensure status is lowercase
              : role
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update admin role status:", errorData);
        toast.error("Failed to update admin role status!");
      }
    } catch (error) {
      console.error("Error updating admin role status:", error);
      toast.error("Error occurred while updating admin role status!");
    }
  };

  const columns = [
    { key: "name", label: "Admin Name" },
    {
      key: "role",
      label: "Assigned Modules",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="!px-3 !py-2 text-bg-primary cursor-pointer hover:bg-gray-200 transition-all"
          onClick={() => handleViewRoles(row)}
        >
          View Roles ({row.sup_roles?.length || 0})
        </Button>
      ),
    },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForAdmin_roless = [
    {
      key: "status",
      label: "Filter by Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: 1, label: "Active" },
        { value: 0, label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      {isEditOpen && selectedRow ? (
        <RoleForm
          type="edit"
          initialData={selectedRow}
          onSuccess={() => {
            fetchAdmin_roless();
            setIsEditOpen(false);
            setSelectedRow(null);
          }}
        />
      ) : (
        <DataTable
          data={Admin_roless}
          columns={columns}
          showAddButton={hasPermission("Admin RoleAdd")} // هذا يتحكم في إرسال الـ prop من الأساس
          addRoute={`/admin-role/add`}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showFilter={true}
          filterKey={["status"]}
          filterOptions={filterOptionsForAdmin_roless}
          searchKeys={["name"]}
          showEditButton={hasPermission("Admin RoleEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
          showDeleteButton={hasPermission("Admin RoleDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
          showActions={
            hasPermission("Admin RoleEdit") || hasPermission("Admin RoleDelete")
          }
          onToggleStatus={handleToggleStatus}
        />
      )}

      {selectedRow && (
        <>
          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
          />
        </>
      )}

      <Dialog open={isViewRolesOpen} onOpenChange={setIsViewRolesOpen}>
        <DialogContent className="bg-white !mb-4 !p-6 rounded-lg shadow-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">
              Assigned Roles
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {selectedRoles.length > 0 ? (
              <div className="!space-y-4">
                {Object.entries(
                  selectedRoles.reduce((acc, role) => {
                    if (!acc[role.module]) acc[role.module] = [];
                    acc[role.module].push(role.action);
                    return acc;
                  }, {})
                ).map(([module, actions]) => (
                  <div
                    key={module}
                    className="border rounded-md !p-3 bg-gray-50 shadow-sm"
                  >
                    <h4 className="font-semibold text-bg-primary !mb-2">
                      {module}
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {actions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p>No roles assigned to this admin position.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin_roles;
