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

const Zones = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [zones, setZones] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

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
    const match = permission.match(/^Zones(.*)$/i);
    if (!match) return false;

    const permKey = match[1].toLowerCase();
    const fullPerm = `Zone:${permKey}`;

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

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const fetchZones = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/zone", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      const formatted = result.zones.map((zone) => {
        console.log("Processing zone:", zone.id, zone.translations); // للـ debugging
        
        // فصل الترجمات حسب اللغة والنوع
        const translations = zone.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        console.log("Parsed translations:", translations); // للـ debugging

        // استخراج البيانات بالإنجليزي (للعرض في الجدول)
        const nameEn = translations?.en?.name || zone.name || "—";
        const descriptionEn = translations?.en?.description || zone.description || "—";

        // استخراج البيانات بالعربي (للـ EditDialog) 
        // هنا هنتأكد إن الترجمة العربية موجودة فعلاً
        const nameAr = translations?.ar?.name || null;
        const descriptionAr = translations?.ar?.description || null;

        const createdDate = new Date(zone.created_at);
        const created_at = `${createdDate.getFullYear()}/${(
          createdDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${createdDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;

        const image =
          zone?.image_link && !imageErrors[zone.id] ? (
            <img
              src={zone.image_link}
              alt={zone.name}
              className="w-12 h-12 rounded-md object-cover aspect-square"
              onError={() => handleImageError(zone.id)}
            />
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>{nameEn?.charAt(0)}</AvatarFallback>
            </Avatar>
          );

        return {
          id: zone.id,
          name: nameEn,
          description: descriptionEn,
          // إضافة الحقول العربية (null لو مش موجودة)
          nameAr: nameAr,
          descriptionAr: descriptionAr,
          img: image,
          created_at,
          image_link: zone.image_link,
          status: zone.status === 1 ? "active" : "inactive",
        };
      });
      setZones(formatted);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error("Failed to load zones data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleEdit = (zone) => {
    setSelectedRow(zone);
    setIsEditOpen(true);
  };

  const handleDelete = (zone) => {
    setSelectedRow(zone);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    if (!hasPermission("ZonesEdit")) {
      toast.error("You don't have permission to edit zones");
      return;
    }

    const { id, name, description, nameAr, descriptionAr, status } = selectedRow;
    const formData = new FormData();

    // بعت الإنجليزي دايماً
    formData.append("name", name || "");
    formData.append("description", description || "");
    
    // بعت العربي بس لو موجود أصلاً في الداتا (يعني الـ zone له ترجمة عربية)
    // مش مهم لو فاضي أو مليان، المهم إنه موجود في الـ structure
    if (selectedRow.nameAr !== null && selectedRow.nameAr !== undefined) {
      formData.append("ar_name", nameAr || "");
    }
    if (selectedRow.descriptionAr !== null && selectedRow.descriptionAr !== undefined) {
      formData.append("ar_description", descriptionAr || "");
    }
    
    formData.append("status", status === "active" ? 1 : 0);
    if (selectedRow.imageFile) {
      formData.append("image", selectedRow.imageFile);
    } else if (selectedRow.image_link) {
      formData.append("image", selectedRow.image_link);
    }

    // للـ debugging - شوفي إيه اللي بيتبعت
    console.log("FormData being sent:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/zone/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Zone updated successfully!");
        await fetchZones();
        setIsEditOpen(false);
        setSelectedRow(null);
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error("Failed to update zone!");
      }
    } catch (error) {
      console.error("Error updating zone:", error);
      toast.error("Error occurred while updating zone!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!hasPermission("ZonesDelete")) {
      toast.error("You don't have permission to delete zones");
      return;
    }

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/zone/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Zone deleted successfully!");
        setZones(zones.filter((zone) => zone.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete zone!");
      }
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("Error occurred while deleting zone!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    if (!hasPermission("ZonesStatus")) {
      toast.error("You don't have permission to change zone status");
      return;
    }

    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/zone/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Zone status updated successfully!");
        setZones((prevZones) =>
          prevZones.map((zone) =>
            zone.id === id
              ? { ...zone, status: newStatus === 1 ? "active" : "inactive" }
              : zone
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update zone status:", errorData);
        toast.error("Failed to update zone status!");
      }
    } catch (error) {
      console.error("Error updating zone status:", error);
      toast.error("Error occurred while updating zone status!");
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedRow((prev) => ({
        ...prev,
        imageFile: file,
      }));
    }
  };

  const columns = [
    { key: "name", label: "Zone Name" },
    { key: "description", label: "Description" },
    { key: "created_at", label: "Added Date" },
    { key: "img", label: "Image" },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForZones = [
    {
      label: "Status",
      key: "status",
      options: [
        { value: "all", label: "All" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={zones}
        columns={columns}
        showAddButton={hasPermission("ZonesAdd")}
        addRoute="/zones/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={hasPermission("ZonesEdit")}
        showDeleteButton={hasPermission("ZonesDelete")}
        showActions={
          hasPermission("ZonesEdit") ||
          hasPermission("ZonesDelete") 
        }
        showFilter={true}
        filterOptions={filterOptionsForZones}
        searchKeys={["description", "name"]}
        className="table-compact"
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
            {/* الحقول الإنجليزية */}
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Zone Name (English)
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
            />

            <label htmlFor="description" className="text-gray-400 !pb-3">
              Description (English)
            </label>
            <Input
              id="description"
              value={selectedRow?.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
            />

            {/* الحقول العربية - بس لو الـ zone أصلاً له ترجمة عربية */}
            {(selectedRow?.nameAr !== null && selectedRow?.nameAr !== undefined) && (
              <>
                <label htmlFor="nameAr" className="text-gray-400 !pb-3">
                  اسم المنطقة (عربي)
                </label>
                <Input
                  id="nameAr"
                  value={selectedRow?.nameAr || ""}
                  onChange={(e) => onChange("nameAr", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                  dir="rtl"
                  placeholder="اسم المنطقة بالعربي"
                />
              </>
            )}

            {(selectedRow?.descriptionAr !== null && selectedRow?.descriptionAr !== undefined) && (
              <>
                <label htmlFor="descriptionAr" className="text-gray-400 !pb-3">
                  الوصف (عربي)
                </label>
                <Input
                  id="descriptionAr"
                  value={selectedRow?.descriptionAr || ""}
                  onChange={(e) => onChange("descriptionAr", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                  dir="rtl"
                  placeholder="وصف المنطقة بالعربي"
                />
              </>
            )}

            <label htmlFor="image" className="text-gray-400">
              Image
            </label>

            {selectedRow?.image_link && (
              <div className="flex items-center gap-4 mb-2">
                <img
                  src={selectedRow.image_link}
                  alt="Current"
                  className="w-12 h-12 rounded-md object-cover border"
                />
              </div>
            )}

            <Input
              type="file"
              id="image"
              accept="image/*"
              className="!my-2 text-bg-primary !ps-2 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[5px]"
              onChange={handleImageChange}
            />
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

export default Zones;