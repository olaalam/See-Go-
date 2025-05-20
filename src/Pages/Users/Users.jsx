"use client";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Users = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

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
        return {
          id: u.id,
          name: trans?.[lang]?.name || u.name || "—",
          email: u.email || "—",
          phone: u.phone || "—",
          gender: trans?.[lang]?.gender || u.gender || "—",
          user_type: trans?.[lang]?.user_type || u.user_type || "—",
          status: u.status === 1 ? "Active" : "Inactive",
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
      name,
      email,
      phone,
      password,
      gender,
      birthDate,
      user_type,
      status,
      rent_from,
      rent_to,
    } = selectedRow;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !gender ||
      !birthDate ||
      !user_type
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const updatedUser = {
      name,
      email,
      phone,
      password,
      gender,
      birthDate,
      user_type,
      rent_from,
      rent_to,
      status: status === "Active" ? 1 : 0,
    };

    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/user/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedUser),
        }
      );

      if (res.ok) {
        toast.success("User updated successfully!");
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id
              ? {
                  ...user,
                  ...updatedUser,
                  status: updatedUser.status === 1 ? "Active" : "Inactive",
                }
              : user
          )
        );
        setIsEditOpen(false);
        setselectedRow(null);
        console.log("Payload being sent:", updatedUser);
      } else {
        toast.error("Failed to update user.");
      }
    } catch (err) {
      toast.error("Error updating user.");
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
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
      [key]: key === "village_id" ? parseInt(value, 10) : value,
    }));
  };

  const handleToggleStatus = async (row, newStatus) => {
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
              ? { ...u, status: newStatus === 1 ? "Active" : "Inactive" }
              : u
          )
        );
      } else toast.error("Failed to update status.");
    } catch (err) {
      toast.error("Error updating status.", err);
    }
  };

  const columns = [
    { key: "name", label: "User Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "user_type", label: "Account Type" },
    { key: "status", label: "Status" },
    { key: "gender", label: "Gender" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={users}
        columns={columns}
        addRoute="/users/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        searchKeys={["name", "email"]}
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
                value={selectedRow.name}
                onChange={(val) => onChange("name", val)}
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
                id="password"
                type="password"
                value={selectedRow.password}
                onChange={(val) => onChange("password", val)}
              />
              <InputField
                label="Birth Date"
                id="birthDate"
                type="date"
                value={selectedRow.birthDate}
                onChange={(val) => onChange("birthDate", val)}
              />
              <InputField
                label="Gender"
                id="gender"
                value={selectedRow.gender}
                onChange={(val) => onChange("gender", val)}
              />
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
                    <SelectItem  className="text-bg-primary "  value="owner">Owner</SelectItem>
                    <SelectItem  className="text-bg-primary " value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
