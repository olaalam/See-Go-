"use client";
import { useEffect, useState, useMemo } from "react"; // Added useMemo
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
import { useNavigate } from "react-router-dom";

const Users = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]); // Kept for potential future use or if needed elsewhere
  const token = localStorage.getItem("token");
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]); // State for permissions

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
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
    const match = permission.match(/^User(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `User:${permKey}`;

    return permissions.includes(fullPerm);
  };

  // Load permissions on component mount
  useEffect(() => {
    const userPermissions = getUserPermissions();
    setPermissions(userPermissions);
  }, []);
  const fetchVillages = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/village", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const lang = localStorage.getItem("lang") || "en";
      const formatted = result.villages.map((v) => {
        const trans = v.translations.reduce((acc, t) => {
          acc[t.locale] = { ...(acc[t.locale] || {}), [t.key]: t.value };
          return acc;
        }, {});
        return {
          id: v.id,
          name: trans[lang]?.name || v.name,
        };
      });
      setVillages(formatted);
    } catch (err) {
      console.error("Error fetching villages:", err);
    }
  };

  const fetchUsers = async () => {
    dispatch(showLoader());
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/user", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const lang = localStorage.getItem("lang") || "en";

      const formatted = result?.users?.map((u) => {
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
          gender: trans?.[lang]?.gender || u.gender || "—",
          // Normalize user_type to lowercase for consistent filtering
          user_type: (
            trans?.[lang]?.user_type ||
            u.user_type ||
            "—"
          ).toLowerCase(),
          // Normalize status to lowercase for consistent filtering
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
          password: "", // This might be a security concern if you're pulling and then resending passwords. Ideally, passwords are not sent back to the frontend.
          birthDate: u.birthDate || "",
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

  useEffect(() => {
    fetchUsers();
    fetchVillages(); // Fetch villages if needed for other parts of the component or future features
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
      rawName, // Use rawName for saving
      email,
      phone,
      gender,
      birthDate,
      user_type,
      status,
      rent_from,
      rent_to,
    } = selectedRow;
    // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("UserEdit")) {
      toast.error("You don't have permission to edit User");
      return;
    }
    // You might want to remove password from this check if it's not always required for updates
    if (!rawName || !email || !phone || !gender || !birthDate || !user_type) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const updatedUser = {
      name: rawName, // Use rawName here
      email,
      phone,
      gender,
      birthDate,
      user_type,
      rent_from,
      rent_to,
      status: status === "active" ? 1 : 0, // Convert normalized status back to API expected format
    };

    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/user/update/${id}`,
        {
          method: "POST", // Often PUT/PATCH for updates, but backend expects POST
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedUser),
        }
      );

      if (res.ok) {
        toast.success("User updated successfully!");
        // Re-fetch users to ensure data consistency after update, or update state locally
        fetchUsers(); // Re-fetching is safer after complex updates
        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        toast.error("Failed to update user.");
      }
    } catch (err) {
      toast.error("Error updating user.");
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
        // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("UserDelete")) {
      toast.error("You don't have permission to delete User");
      return;
    }
    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/user/delete/${selectedRow.id}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );
      if (res.ok) {
        toast.success("User deleted successfully!");
        setUsers(users.filter((u) => u.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else toast.error("Failed to delete user!");
    } catch (err) {
      toast.error("Error deleting user!", err);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => ({
      ...prev,
      // Ensure user_type and status are normalized to lowercase when set
      [key]:
        key === "user_type" || key === "status" ? value.toLowerCase() : value,
    }));
  };

  const handleToggleStatus = async (row, newStatus) => {
        // لا يزال من الجيد عمل هذا الفحص هنا أيضًا كطبقة حماية إضافية
    if (!hasPermission("UserStatus")) {
      toast.error(
        "You don't have permission to change  User"
      );
      return;
    }
    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/user/status/${row.id}?status=${newStatus}`,
        { method: "PUT", headers: getAuthHeaders() }
      );
      if (res.ok) {
        toast.success("Status updated!");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === row.id
              ? { ...u, status: newStatus === 1 ? "active" : "inactive" } // Normalize status
              : u
          )
        );
      } else toast.error("Failed to update status.");
    } catch (err) {
      toast.error("Error updating status.", err);
    }
  };

  // Dynamically generate filter options for user_type and combine with status options
  const userTypeOptions = useMemo(() => { // Memoize this to prevent unnecessary re-renders
    return Array.from(
      new Set(users.map((user) => user.user_type))
    )
      .filter((type) => type !== "—") // Filter out placeholder values if any
      .map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      })); // Capitalize for display
  }, [users]);


  // Restructure filter options for the accordion
const filterOptionsForUsers = [
  {
    label: "Account Type",
    key: "user_type",
    options: [
      { value: "all", label: "All Account Types" },
      ...userTypeOptions,
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
    { key: "status", label: "Status" },
  ];
  console.log(
    "Has UserAdd permission:",
    hasPermission("UserAdd")
  );
  console.log(
    "Has UserEdit permission:",
    hasPermission("UserEdit")
  );
  console.log(
    "Has UserDelete permission:",
    hasPermission("UserDelete")
  );
  console.log(
    "Has UserStatus permission:",
    hasPermission("UserStatus")
  );
  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={users}
        columns={columns}
                showAddButton={hasPermission("UserAdd")} // هذا يتحكم في إرسال الـ prop من الأساس

        addRoute="/users/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
         showEditButton={hasPermission("UserEdit")} // هذا يتحكم في إرسال الـ prop من الأساس
        showDeleteButton={hasPermission("UserDelete")} // هذا يتحكم في إرسال الـ prop من الأساس
        showActions={hasPermission("UserEdit") || hasPermission("UserDelete")}
        searchKeys={["name", "email", "phone"]}
        showFilter={true}
        // filterKey is no longer needed here, DataTable will manage it
        filterOptions={filterOptionsForUsers} // Pass combined filter options
      />
      {selectedRow && (
        <>
          <EditDialog
            className="!p-4"
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
          >
            <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <InputField
                label="Name"
                id="name"
                value={selectedRow.rawName} // Use rawName for editing
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
{/**              <InputField
                label="Birth Date"
                id="birthDate"
                type="date"
                value={selectedRow.birthDate}
                onChange={(val) => onChange("birthDate", val)}
              /> */}
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
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  <SelectItem className="text-bg-primary " value="male">
                    Male
                  </SelectItem>
                  <SelectItem className="text-bg-primary " value="female">
                    Female
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Account Type Select - Uncomment and use if needed for editing */}
              {/*
              <div>
                <Label htmlFor="user_type" className="text-gray-400 !pb-1">
                  Account Type
                </Label>
                <Select
                  value={selectedRow.user_type}
                  onValueChange={(val) => onChange("user_type", val)}
                >
                  <SelectTrigger className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                    <SelectItem className="text-bg-primary " value="owner">
                      Owner
                    </SelectItem>
                    <SelectItem className="text-bg-primary " value="visitor">
                      Visitor
                    </SelectItem>
                    <SelectItem className="text-bg-primary " value="rent">
                      Renter
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              */}

              {/* Rent From/To fields - Uncomment if needed */}
              {/*
              {selectedRow.user_type === "rent" && (
                <>
                  <InputField
                    label="Rent From"
                    id="rent_from"
                    type="date"
                    value={selectedRow.rent_from}
                    onChange={(val) => onChange("rent_from", val)}
                  />
                  <InputField
                    label="Rent To"
                    id="rent_to"
                    type="date"
                    value={selectedRow.rent_to}
                    onChange={(val) => onChange("rent_to", val)}
                  />
                </>
              )}
              */}
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.rawName} // Use rawName for display in delete dialog
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