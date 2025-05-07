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

const Zones = () => {
    const dispatch = useDispatch();
    const isLoading = useSelector((state) => state.loader.isLoading);
    const [zones, setZones] = useState([]);
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

            const result = await response.json();
            const currentLang = localStorage.getItem("lang") || "en";

            const formatted = result.zones.map((zone) => {
                const translations = zone.translations.reduce((acc, t) => {
                    if (!acc[t.locale]) acc[t.locale] = {};
                    acc[t.locale][t.key] = t.value;
                    return acc;
                }, {});

                const name = translations[currentLang]?.name || zone.name || "—";
                const description = translations[currentLang]?.description || zone.description || "—";

                const image = zone?.image_link && !imageErrors[zone.id] ? (
                    <img
                        src={zone.image_link}
                        alt={name}
                        className="w-12 h-12 rounded-md object-cover aspect-square"
                        onError={() => handleImageError(zone.id)}
                    />
                ) : (
                    <Avatar className="w-12 h-12">
                        <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                );

                return {
                    id: zone.id,
                    name,
                    description,
                    img: image,
                    numberOfVillages: zone.villages_count ?? "0",
                    status: zone.status === 1 ? "Active" : "Inactive",
                    image_link: zone.image_link, // Keep the raw link for updating
                };
            });

            setZones(formatted);
        } catch (error) {
            console.error("Error fetching zones:", error);
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
        const { id, name, description, numberOfVillages, status, imageFile } = selectedRow;

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("villages_count", parseInt(numberOfVillages));
        formData.append("status", status === "Active" ? 1 : 0);

        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            const response = await fetch(`https://bcknd.sea-go.org/admin/zone/update/${id}`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData,
            });

            if (response.ok) {
                toast.success("Zone updated successfully!");
                const responseData = await response.json();

                setZones((prev) =>
                    prev.map((zone) =>
                        zone.id === id
                            ? {
                                ...zone,
                                name: responseData?.zone?.name || name,
                                description: responseData?.zone?.description || description,
                                villages_count: responseData?.zone?.villages_count || parseInt(numberOfVillages),
                                status: responseData?.zone?.status === 1 ? "Active" : "Inactive",
                                image_link: responseData?.zone?.image_link || zone.image_link,
                                img: responseData?.zone?.image_link ? (
                                    <img
                                        src={responseData.zone.image_link}
                                        alt={responseData?.zone?.name || name}
                                        className="w-12 h-12 rounded-md object-cover aspect-square"
                                        onError={() => { }}
                                    />
                                ) : (
                                    <Avatar className="w-12 h-12">
                                        <AvatarFallback>{responseData?.zone?.name?.charAt(0) || name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                ),
                            }
                            : zone
                    )
                );
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
        const { id } = row;

        try {
            const response = await fetch(`https://bcknd.sea-go.org/admin/zone/status/${id}?status=${newStatus}`, {
                method: "PUT",
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                toast.success("Zone status updated successfully!");
                setZones((prevZones) =>
                    prevZones.map((zone) =>
                        zone.id === id ? { ...zone, status: newStatus === 1 ? "Active" : "Inactive" } : zone
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
        { key: "numberOfVillages", label: "Number of Villages" },
        { key: "img", label: "Image" },
        { key: "status", label: "Status" },
    ];

    return (
        <div className="p-4">
            {isLoading && <FullPageLoader />}
            <ToastContainer />

            <DataTable
                data={zones}
                columns={columns}
                addRoute="/zones/add"
                className="table-compact"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
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
                        <label htmlFor="name" className="text-gray-400 !pb-3">
                            Zone Name
                        </label>
                        <Input
                            id="name"
                            value={selectedRow?.name || ""}
                            onChange={(e) => onChange("name", e.target.value)}
                            className="!my-2 text-bg-primary !p-4"
                        />

                        <label htmlFor="description" className="text-gray-400 !pb-3">
                            Description
                        </label>
                        <Input
                            id="description"
                            value={selectedRow?.description || ""}
                            onChange={(e) => onChange("description", e.target.value)}
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

export default Zones;