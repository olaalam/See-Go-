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

const Admins = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [admins, setadmins] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fetchadmins = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/admins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const result = await response.json();

      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = result.admins.map((admin) => {
        const translations = (admin.translations || []).reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || admin.name || "—";
        const email = translations[currentLang]?.email || admin.email || "—";
        const phone = translations[currentLang]?.phone || admin.phone || "—";
        const role =
          translations[currentLang]?.provider_only ||
          admin.provider_only ||
          "—";

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
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        return {
          id: admin.id,
          name,
          email,
          role: admin.provider_only,
          phone,
          img: image,
          status: admin.status === 1 ? "Active" : "Inactive",
          image_link: admin.image_link,
          gender: admin.gender || "—",
        };
      });

      setadmins(formatted);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchadmins();
  }, []);

  const handleEdit = (admin) => {
    setSelectedRow(admin);
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

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("role", role);
    formData.append("password", password);

    formData.append("provider_only", role);
    formData.append("gender", gender);
    formData.append("status", status === "Active" ? 1 : 0);

    if (imageFile) {
      formData.append("image", imageFile);
    }

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
        toast.success("admin updated successfully!");
        const responseData = await response.json();

        setadmins((prev) =>
          prev.map((admin) =>
            admin.id === id
              ? {
                  ...admin,
                  name: responseData?.admin?.name || name,
                  phone: responseData?.admin?.phone || phone,
                  email: responseData?.admin?.email || email,
                  role: responseData?.admin?.provider_only, // Update with the boolean value
                  gender: responseData?.admin?.gender || gender,
                  status:
                    responseData?.admin?.status === 1 ? "Active" : "Inactive",
                  image_link:
                    responseData?.admin?.image_link || admin.image_link,
                  img: responseData?.admin?.image_link ? (
                    <img
                      src={responseData.admin.image_link}
                      alt={responseData?.admin?.name || name}
                      className="w-12 h-12 rounded-md object-cover aspect-square"
                      onError={() => handleImageError(id)}
                    />
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {responseData?.admin?.name?.charAt(0) ||
                          name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ),
                }
              : admin
          )
        );
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update admin!");
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Error occurred while updating admin!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admins/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("admin deleted successfully!");
        setadmins(admins.filter((admin) => admin.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete admin!");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Error occurred while deleting admin!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/admins/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("admin status updated successfully!");
        setadmins((prevadmins) =>
          prevadmins.map((admin) =>
            admin.id === id
              ? { ...admin, status: newStatus === 1 ? "Active" : "Inactive" }
              : admin
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update admin status:", errorData);
        toast.error("Failed to update admin status!");
      }
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Error occurred while updating admin status!");
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedRow((prev) => ({
        ...prev,
        imageFile: file,
      }));
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => (row.role === 1 ? "Provider" : "Admin"), // Display "Provider" or "Admin"
    },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
    { key: "gender", label: "Gender" },
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
        searchKeys={["name", "phone"]}
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
              />
              <label htmlFor="email" className="text-gray-400 !pb-3">
                Email
              </label>
              <Input
                id="email"
                value={selectedRow?.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="role" className="text-gray-400 !pb-3">
                Role
              </label>
              {selectedRow?.role === 1 ? (
                <Input
                  id="role"
                  value="Provider"
                  
                  className="!my-2 text-bg-primary !p-4"
                />
              ) : (
                <Select
                  value={selectedRow?.role?.toString()}
                  onValueChange={(value) =>
                    onChange("role", value === "all" ? 0 : 1)
                  } 
                >
                  <SelectTrigger
                    id="role"
                    className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                    <SelectItem value="0" className="text-bg-primary">
                      All/Admin
                    </SelectItem>
                    <SelectItem value="1" className="text-bg-primary">
                      Provider
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              <label htmlFor="phone" className="text-gray-400 !pb-3">
                Phone
              </label>

              <Input
                id="phone"
                value={selectedRow?.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="gender" className="text-gray-400 !pb-3">
                Gender
              </label>
              <Select
                value={selectedRow?.gender}
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
              <label htmlFor="password" className="text-gray-400 !pb-3">
                Password
              </label>
              <Input
                id="password"
                value={selectedRow?.password || ""}
                onChange={(e) => onChange("password", e.target.value)}
                className="!my-2 text-bg-primary !p-4"
              />
              <label htmlFor="image" className="text-gray-400 !pb-3">
                Image
              </label>
              <Input
                type="file"
                id="image"
                accept="image/*"
                className="!my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[5px]"
                onChange={handleImageChange}
              />
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
    </div>
  );
};

export default Admins;
