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

const Villages = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [villages, setVillages] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedRow, setselectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Utility function for headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer 1|lT28bSsFeyAMSLJGnHcIYMDekPJRx3M1T6ROsQlmf0208b31",
  });

  const fetchZones = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/zone", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const currentLang = localStorage.getItem("lang") || "en";
      const formattedZones = result.zones.map((zone) => {
        const translations = zone.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});
        return {
          id: zone.id,
          name: translations[currentLang]?.name || zone.name,
        };
      });
      setZones(formattedZones);
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchVillages = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/village", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = result?.villages.map((village) => {
        const translations = village.translations.reduce((acc, t) => {
          if (!acc[t.locale]) acc[t.locale] = {};
          acc[t.locale][t.key] = t.value;
          return acc;
        }, {});

        const name = translations[currentLang]?.name || village.name || "—";
        const description =
          translations[currentLang]?.description || village.description || "—";
        const zoneName =
          village.zone?.translations?.find(
            (t) => t.locale === currentLang && t.key === "name"
          )?.value ||
          village.zone?.name ||
          "—";

        const image = village?.image_link ? (
          <img
            src={village.image_link}
            alt={name}
            className="w-12 h-12 rounded-md object-cover aspect-square"
            onError={() => {}}
          />
        ) : (
          <Avatar className="w-12 h-12">
            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
          </Avatar>
        );

        // جلب location و population_count من الـ API إذا كانوا موجودين
        const location = village.location || "—"; // أو تعيين القيمة الافتراضية إذا لم تكن موجودة
        const population = village.population_count || "—"; // تعيين القيمة الافتراضية

        return {
          id: village.id,
          name,
          description,
          img: image,
          numberOfVillages: village.villages_count ?? "0",
          status: village.status === 1 ? "Active" : "Inactive",
          zone_id: village.zone_id,
          zoneName,
          location,
          population,
        };
      });

      setVillages(formatted);
    } catch (error) {
      console.error("Error fetching villages:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    // Fetch zones and villages in one go
    const fetchData = async () => {
      await Promise.all([fetchVillages(), fetchZones()]);
    };
    fetchData();
  }, []);

  const handleEdit = (village) => {
    console.log("تم النقر على تعديل القرية:", village);
    setselectedRow(village);
    setIsEditOpen(true);
    console.log("isEditOpen:", isEditOpen);
    console.log("selectedRow:", selectedRow);
  };

  const handleDelete = (village) => {
    setselectedRow(village);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    const {
      id,
      name,
      description,
      numberOfVillages,
      status,
      zone_id,
      location,
      population,
    } = selectedRow;

    if (!zone_id || isNaN(zone_id)) {
      toast.error("Zone ID is missing or invalid");
      return;
    }

    const updatedVillage = {
      name,
      description,
      villages_count: parseInt(numberOfVillages),
      status: status === "Active" ? 1 : 0,
      zone_id: parseInt(zone_id),
      location,
      population_count: parseInt(population) || 0,
    };

    console.log("Sending updated village data:", updatedVillage);

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/update/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedVillage),
        }
      );

      if (response.ok) {
        toast.success("Village updated successfully!");
        setVillages((prev) =>
          prev.map((village) =>
            village.id === id
              ? {
                  ...village,
                  ...updatedVillage,
                  status: updatedVillage.status === 1 ? "Active" : "Inactive",
                }
              : village
          )
        );
        setIsEditOpen(false);
        setselectedRow(null);
      } else {
        const errText = await response.text();
        console.error("Failed to update:", errText);
        toast.error("Failed to update village!");
      }
    } catch (error) {
      console.error("Error occurred while updating village!", error);
      toast.error("Error occurred while updating village!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Village deleted successfully!");
        setVillages(
          villages.filter((village) => village.id !== selectedRow.id)
        );
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete village!");
      }
    } catch (error) {
      toast.error("Error occurred while deleting village!", error);
    }
  };

  const onChange = (key, value) => {
    setselectedRow((prev) => ({
      ...prev,
      [key]: key === "zone_id" ? parseInt(value, 10) : value,
    }));
  };
  const handleImageChange = (event) => {
     const file = event.target.files[0];
     if (file) {

   setselectedRow((prev) => ({
    ...prev,
    imageFile: file, // قم بتخزين الملف
   }));
     }
     };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Village status updated successfully!");
        setVillages((prevVillages) =>
          prevVillages.map((village) =>
            village.id === id
              ? { ...village, status: newStatus === 1 ? "Active" : "Inactive" }
              : village
          )
        );
      } else {
        toast.error("Failed to update village status!");
      }
    } catch (error) {
      toast.error("Error occurred while updating village status!", error);
    }
  };

  const columns = [
    { key: "name", label: "Village Name" },
    { key: "description", label: "Description" },
    { key: "numberOfUnits", label: "Number of Units" },
    { key: "zoneName", label: "Zone" },
    { key: "location", label: "Location" },
    { key: "img", label: "Image" },
    { key: "population", label: "Population" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />
      <DataTable
        data={villages}
        columns={columns}
        addRoute="/Villages/add"
        className="table-compact"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
      {selectedRow && (
        <>
          {selectedRow && (
            <>
              <EditDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSave={handleSave}
                selectedRow={selectedRow}
                zones={zones}
                onChange={onChange}
              >

                <label htmlFor="name" className="text-gray-400 !pb-3">
                  Village Name
                </label>
               
                <Input
                  label="Village Name"
                  id="name"
                  value={selectedRow?.name || ""}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />

                <label htmlFor="description" className="text-gray-400 !pb-3">
                  Description
                </label>

                <Input
                  label="Description"
                  id="description"
                  value={selectedRow?.description || ""}
                  onChange={(e) => onChange("description", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />

                <label htmlFor="zone" className="text-gray-400 !pb-3">
                Zone 
                </label>
                <Select
                  value={selectedRow?.zone_id?.toString()}
                  onValueChange={(value) => onChange("zone_id", value)}
                >
                  <SelectTrigger
                    id="zone"
                    className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary rounded-[10px]"
                  >
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                    
                    {zones.map((zone) => (
                      <SelectItem
                        key={zone.id}
                        value={zone.id.toString()}
                        className="text-bg-primary "
                      >
                       {zone.name}
                      </SelectItem>
                    ))}
                    
                  </SelectContent>
                 
                </Select>
               
                <label htmlFor="location" className="text-gray-400 !pb-3">
                  Location 
                </label>

                <Input
                  id="location"
                  label="Location"
                  value={selectedRow?.location || ""}
                  onChange={(e) => onChange("location", e.target.value)}
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
                name={selectedRow.name}
              />
            </>
          )}
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

export default Villages;
