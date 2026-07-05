"use client";
import { useEffect, useState, useMemo } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Users = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "https://bcknd.sea-go.org";

  // 🌟 1. حالات الترقيم (Pagination States) بناءً على ريسبونس لارافيل
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // عشان يعرض Total: 919 بدل 15
  const [searchQuery, setSearchQuery] = useState("");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const getUserPermissions = () => {
    try {
      const permissions = localStorage.getItem("userPermission");
      const parsed = permissions ? JSON.parse(permissions) : [];
      return parsed.map((perm) => `${perm.module}:${perm.action}`);
    } catch (error) {
      console.error("Error parsing user permissions:", error);
      return [];
    }
  };

  const hasPermission = (permission) => {
    const match = permission.match(/^User(.*)$/i);
    if (!match) return false;
    const permKey = match[1].toLowerCase();
    const fullPerm = `User:${permKey}`;
    return permissions.includes(fullPerm);
  };

  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);

  const fetchVillages = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/village`, {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const lang = localStorage.getItem("lang") || "en";
      const formatted = result?.villages?.map((v) => {
        const trans = v.translations.reduce((acc, t) => {
          acc[t.locale] = { ...(acc[t.locale] || {}), [t.key]: t.value };
          return acc;
        }, {});
        return {
          id: v.id,
          name: trans[lang]?.name || v.name,
        };
      });
      setVillages(formatted || []);
    } catch (err) {
      console.error("Error fetching villages:", err);
    }
  };

  // 🌟 2. دالة جلب البيانات مع الترقيم والبحث
  const fetchUsers = async (page = 1, search = "") => {
    dispatch(showLoader());
    try {
      // بناء الرابط مع رقم الصفحة وكلمة البحث
      const url = new URL(`${apiUrl}/admin/user/users`);
      url.searchParams.append("page", page);
      if (search) url.searchParams.append("search", search);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const lang = localStorage.getItem("lang") || "en";

      // 🌟 قراءة هيكل بيانات لارافيل (Laravel Pagination Structure)
      const userData = result?.users || {};
      const usersArray = userData.data || [];

      // تحديث بيانات الترقيم من الباك إند مباشرة
      setCurrentPage(userData.current_page || 1);
      setTotalPages(userData.last_page || 1);
      setTotalItems(userData.total || 0);

      const formatted = usersArray.map((u) => {
        const trans = u.translations?.reduce((acc, t) => {
          acc[t.locale] = { ...(acc[t.locale] || {}), [t.key]: t.value };
          return acc;
        }, {});
        const name = u.name || "—";
        const rawName = name;

        const nameClickable = (
          <span
            onClick={() => navigate(`/users/single-page-u/${u.id}`)}
            className="text-bg-primary hover:text-teal-800 cursor-pointer"
          >
            {name}
          </span>
        );
        return {
          id: u.id,
          name: nameClickable,
          rawName,
          email: u.email || "—",
          phone: u.phone || "—",
          gender: (trans?.[lang]?.gender || u.gender || "—").toLowerCase(),
          user_type: (
            trans?.[lang]?.user_type ||
            u.user_type ||
            "—"
          ).toLowerCase(),
          status: u.status === 1 ? "active" : "inactive",
          img: u.image_link ? (
            <img
              src={u.image_link}
              alt={u.name}
              className="w-12 h-12 object-cover rounded-md"
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          ),
          password: "",
          rent_from: u.rent_from || "",
          rent_to: u.rent_to || "",
        };
      });
      setUsers(formatted);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      dispatch(hideLoader());
    }
  };

  // جلب أول صفحة عند فتح الشاشة
  useEffect(() => {
    fetchUsers(1, "");
    fetchVillages();
  }, []);

  const handleEdit = (user) => {
    setselectedRow(user);
    setIsEditOpen(true);
  };

  const handleDelete = (user) => {
    setselectedRow(user);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    const {
      id,
      rawName,
      email,
      phone,
      gender,
      password,
      user_type,
      status,
      rent_from,
      rent_to,
    } = selectedRow;
    setIsSaving(true);
    if (!hasPermission("UserEdit")) {
      toast.error("You don't have permission to edit User");
      return;
    }

    if (!rawName || !email || !phone || !gender) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const updatedUser = {
      name: rawName,
      email,
      phone,
      gender,
      password,
      user_type,
      rent_from,
      rent_to,
      status: status === "active" ? 1 : 0,
    };

    try {
      const res = await fetch(`${apiUrl}/admin/user/update/${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser),
      });

      if (res.ok) {
        toast.success("User updated successfully!");
        fetchUsers(currentPage, searchQuery); // تحديث نفس الصفحة الحالية
        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errorData = await res.json();
        console.error("API error:", errorData);
        toast.error("Failed to update user.");
      }
    } catch (err) {
      toast.error("Error updating user.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!hasPermission("UserDelete")) {
      toast.error("You don't have permission to delete User");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${apiUrl}/admin/user/delete/${selectedRow.id}`,
        { method: "DELETE", headers: getAuthHeaders() },
      );
      if (res.ok) {
        toast.success("User deleted successfully!");
        fetchUsers(currentPage, searchQuery);
        setIsDeleteOpen(false);
      } else toast.error("Failed to delete user!");
    } catch (err) {
      toast.error("Error deleting user!", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => ({
      ...prev,
      [key]:
        key === "user_type" || key === "status" ? value.toLowerCase() : value,
    }));
  };

  const handleToggleStatus = async (row, newStatus) => {
    if (!hasPermission("UserStatus")) {
      toast.error("You don't have permission to change User");
      return;
    }
    try {
      const res = await fetch(
        `${apiUrl}/admin/user/status/${row.id}?status=${newStatus}`,
        { method: "PUT", headers: getAuthHeaders() },
      );
      if (res.ok) {
        toast.success("Status updated!");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === row.id
              ? { ...u, status: newStatus === 1 ? "active" : "inactive" }
              : u,
          ),
        );
      } else toast.error("Failed to update status.");
    } catch (err) {
      toast.error("Error updating status.", err);
    }
  };

  const handleForceLogout = async (userId) => {
    dispatch(showLoader());
    try {
      const response = await fetch(`${apiUrl}/admin/user/logout_user/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("User logged out successfully!");
        await fetchUsers(currentPage, searchQuery);
      } else {
        const errorData = await response.json();
        console.error("Force logout failed:", errorData);
        toast.error("Failed to force logout user!");
      }
    } catch (error) {
      console.error("Error during force logout:", error);
      toast.error("Error occurred while forcing logout!");
    } finally {
      dispatch(hideLoader());
    }
  };

  const filterOptionsForUsers = [
    {
      label: "Account Type",
      key: "user_type",
      options: [
        { value: "all", label: "All Account Types" },
        { value: "owner", label: "Owner" },
        { value: "visitor", label: "Visitor" },
        { value: "rent", label: "Renter" },
      ],
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const columns = [
    { key: "name", label: "User Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "user_type", label: "Account Type" },
    { key: "gender", label: "Gender" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 !p-2 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer flex items-center gap-2 transition-all"
          onClick={() => handleForceLogout(row.id)}
        >
          <LogOut className="w-4 h-4" />
          Force Logout
        </Button>
      ),
    },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={users}
        columns={columns}
        showAddButton={hasPermission("UserAdd")}
        addRoute="/users/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={hasPermission("UserEdit")}
        showDeleteButton={hasPermission("UserDelete")}
        showActions={hasPermission("UserEdit") || hasPermission("UserDelete")}
        searchKeys={["name", "email", "phone"]}
        showFilter={true}
        filterOptions={filterOptionsForUsers}
        
        // 🌟 3. تمرير الخصائص للجدول عشان يعرض Total: 919 ويتنقل بين الـ 62 صفحة
        // قمت بتمرير الأسماء الشائعة للـ props عشان تشتغل أياً كانت الطريقة اللي مكتوب بيها DataTableLayout
        isBackendPagination={true}
        serverSide={true}
        
        currentPage={currentPage}
        backendCurrentPage={currentPage}
        
        totalPages={totalPages}
        backendTotalPages={totalPages}
        
        totalItems={totalItems} // ده اللي هيخلي كلمة Total: 15 تتغير لـ Total: 919
        totalCount={totalItems}
        total={totalItems}
        
        // دالة تغيير الصفحة لما تضغطي على رقم 2، 3، إلخ
        onPageChange={(page) => {
          setCurrentPage(page);
          fetchUsers(page, searchQuery);
        }}
        onBackendPageChange={(page) => {
          setCurrentPage(page);
          fetchUsers(page, searchQuery);
        }}
        
        // دالة البحث من الباك إند
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
          fetchUsers(1, val);
        }}
      />
      {selectedRow && (
        <>
          <EditDialog
            className="!p-4"
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            isSaving={isSaving}
            selectedRow={selectedRow}
          >
            <div className="max-h-[70vh] md:grid-cols-2 lg:grid-cols-3 !p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <InputField
                label="Name"
                id="name"
                value={selectedRow.rawName}
                onChange={(val) => onChange("rawName", val)}
              />
              <InputField
                label="Email"
                id="email"
                value={selectedRow.email}
                onChange={(val) => onChange("email", val)}
              />
              <InputField
                label="Phone"
                id="phone"
                value={selectedRow.phone}
                onChange={(val) => onChange("phone", val)}
              />
              <InputField
                label="Password"
                type="password"
                id="password"
                value={selectedRow.password}
                onChange={(val) => onChange("password", val)}
              />

              <Label htmlFor="gender" className="text-gray-400 !pb-1">
                Gender
              </Label>
              <Select
                value={selectedRow.gender}
                onValueChange={(val) => onChange("gender", val)}
              >
                <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary !z-[99999] !max-h-60">
                  <SelectItem className="text-bg-primary" value="male">
                    Male
                  </SelectItem>
                  <SelectItem className="text-bg-primary" value="female">
                    Female
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            isDeleting={isDeleting}
            name={selectedRow.rawName}
          />
        </>
      )}
    </div>
  );
};

const InputField = ({ label, id, value, onChange, type = "text" }) => (
  <div>
    <Label htmlFor={id} className="text-gray-400 !pb-1">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
    />
  </div>
);

export default Users;