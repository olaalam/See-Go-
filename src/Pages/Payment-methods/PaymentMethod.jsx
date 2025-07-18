
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDispatch, useSelector } from 'react-redux';
import { showLoader, hideLoader } from '@/Store/LoaderSpinner';
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";

const Payment_methods = () => {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state.loader.isLoading);
    const [payment_methods, setPaymentMethods] = useState([]);
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

    const fetchpayment_methods = async () => {
        dispatch(showLoader());
        try {
            const response = await fetch("https://bcknd.sea-go.org/admin/payment_method", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
            });

            const result = await response.json();

            const formatted = result.payment_methods.map((payment_method) => {
        // فصل الترجمات حسب اللغة والنوع
        const translations = payment_method.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

                 const nameEn = translations?.en?.name || payment_method.name || "—";
        const descriptionEn = translations?.en?.description || payment_method.description || "—";

        // استخراج البيانات بالعربي (للـ EditDialog) 
        // هنا هنتأكد إن الترجمة العربية موجودة فعلاً
        const nameAr = translations?.ar?.name || null;
        const descriptionAr = translations?.ar?.description || null;

                const createdDate = new Date(payment_method.created_at);
                const created_at = `${createdDate.getFullYear()}/${(createdDate.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}/${createdDate.getDate().toString().padStart(2, "0")}`;
                
                const image = payment_method?.logo_link && !imageErrors[payment_method.id] ? (
                    <img
                        src={payment_method.logo_link}
                        alt={name}
                        className="w-12 h-12 rounded-md object-cover aspect-square"
                        onError={() => handleImageError(payment_method.id)}
                    />
                ) : (
                    <Avatar className="w-12 h-12">
                        <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                );
                

                return {
                    id: payment_method.id,
          name: nameEn,
          description: descriptionEn,
          // إضافة الحقول العربية (null لو مش موجودة)
          nameAr: nameAr,
          descriptionAr: descriptionAr,
                    img: image,
                    created_at,
                    status: payment_method.status === 1 ? "Active" : "Inactive",
                    logo_link: payment_method.logo_link, 
                };
                
            });

            setPaymentMethods(formatted);
        } catch (error) {
            console.error("Error fetching payment_methods:", error);
        } finally {
            dispatch(hideLoader());
        }
    };

    useEffect(() => {
        fetchpayment_methods();
    }, []);

    const handleEdit = (payment_method) => {
      setSelectedRow(payment_method);
      setIsEditOpen(true);
  };

    const handleDelete = (payment_method) => {
        setSelectedRow(payment_method);
        setIsDeleteOpen(true);
    };

    const handleSave = async () => {
        if (!selectedRow) return;
        const { id, name, description, nameAr, descriptionAr, status, imageFile } = selectedRow;
    
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
        formData.append("status", status === "Active" ? 1 : 0);
    
        if (imageFile) {
            formData.append("logo", imageFile); 
        }else{
                  formData.append("keep_current_image", "true");
            formData.append("logo", selectedRow.logo);
        }
    
        try {
            const response = await fetch(`https://bcknd.sea-go.org/admin/payment_method/update/${id}`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData,
            });
    
            if (response.ok) {
                toast.success("Payment method updated successfully!");
                await fetchpayment_methods();
                setIsEditOpen(false);
                setSelectedRow(null);
            } else {
                const errorData = await response.json();
                console.error("Update failed:", errorData);
                toast.error("Failed to update payment method!");
            }
        } catch (error) {
            console.error("Error updating payment method:", error);
            toast.error("Error occurred while updating payment method!");
        }
    };
    

    const handleDeleteConfirm = async () => {
        try {
            const response = await fetch(
                `https://bcknd.sea-go.org/admin/payment_method/delete/${selectedRow.id}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                }
            );

            if (response.ok) {
                toast.success("payment_method deleted successfully!");
                setPaymentMethods(payment_methods.filter((payment_method) => payment_method.id !== selectedRow.id));
                setIsDeleteOpen(false);
            } else {
                toast.error("Failed to delete payment_method!");
            }
        } catch (error) {
            console.error("Error deleting payment_method:", error);
            toast.error("Error occurred while deleting payment_method!");
        }
    };

    const handleToggleStatus = async (row, newStatus) => {
        const { id } = row;

        try {
            const response = await fetch(`https://bcknd.sea-go.org/admin/payment_method/status/${id}?status=${newStatus}`, {
                method: "PUT",
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                toast.success("payment_method status updated successfully!");
                setPaymentMethods((prevpayment_methods) =>
                    prevpayment_methods.map((payment_method) =>
                        payment_method.id === id ? { ...payment_method, status: newStatus === 1 ? "Active" : "Inactive" } : payment_method
                    )
                );
            } else {
                const errorData = await response.json();
                console.error("Failed to update payment_method status:", errorData);
                toast.error("Failed to update payment_method status!");
            }
        } catch (error) {
            console.error("Error updating payment_method status:", error);
            toast.error("Error occurred while updating payment_method status!");
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
  // Define filter options for status, including an "All" option
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
        { key: "name", label: "Payment Method" },
        { key: "description", label: "Description" },
        { key: "created_at", label: "Added Date" },
        { key: "img", label: "Image" },
        { key: "status", label: "Status" },
    ];

    return (
        <div className="p-4">
            {isLoading && <FullPageLoader />}
            <ToastContainer />

            <DataTable
                data={payment_methods}
                columns={columns}
                addRoute="/payment-methods/add"
                className="table-compact"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                 searchKeys={[ "description","name"]}
                               filterKey={["status"]} // Specify that we want to filter by the 'status' key
              filterOptions={filterOptionsForZones}
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
              Payment Method (English)
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

            {selectedRow?.logo_link && (
              <div className="flex items-center gap-4 mb-2">
                <img
                  src={selectedRow.logo_link}
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
                        selectedRow={selectedRow}
                    />
                </>
            )}
        </div>
    );
};

export default Payment_methods;