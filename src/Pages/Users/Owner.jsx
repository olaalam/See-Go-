import React, { useState, useEffect } from "react";
import { FaMapPin, FaUsers, FaTrash } from "react-icons/fa"; // قمنا بإضافة أيقونة السلة FaTrash
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import Loading from "@/components/Loading";
import RenterTab from "./RenterTab";
import DeleteDialog from "@/components/DeleteDialog"; // استيراد مودال الحذف المتاح لديك

export default function Owner() {
  const { id } = useParams();
  const [propertiesList, setPropertiesList] = useState([]);
  const [rentsList, setRentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // حالات التحكم في مودال الحذف والـ id المختار للحذف
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null); // هنا بنحتفظ بالـ id الخاص بالكارد المختار

  useEffect(() => {
    async function fetchUnitsData() {
      if (!id) {
        setLoading(false);
        setError("No user ID available to fetch data.");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Missing authentication token.");
        }

        const res = await fetch(
          `https://bcknd.sea-go.org/admin/user/units/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        
        console.log("Units API Response:", json);
        
        setPropertiesList(json.property || []);
        setRentsList(json.rents || []);
      } catch (err) {
        console.error("Error fetching units data:", err.message);
        setError("Failed to load properties and rentals data.");
      } finally {
        setLoading(false);
      }
    }

    fetchUnitsData();
  }, [id]);

  // دالة التعامل مع حذف الكارد الفردي وإرسال الـ id الخاص به
  const handleDeleteCard = async () => {
    if (!selectedCardId) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing authentication token.");

      const res = await fetch("https://bcknd.sea-go.org/admin/user/delete_user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: Number(selectedCardId) }), // نرسل الـ id الفردي الخاص بالكارد المختار هنا
      });

      if (!res.ok) {
        throw new Error(`Failed to delete item. Status: ${res.status}`);
      }

      // تحديث الواجهة وحذف الكارد من القائمة المحلية فوراً بدون عمل refresh للمتصفح
      setPropertiesList((prev) => prev.filter((item) => item.id !== selectedCardId));
      
      setIsDeleteDialogOpen(false);
      setSelectedCardId(null);
    } catch (err) {
      console.error("Error deleting item:", err.message);
      alert(err.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const OwnerContent = () => {
    if (propertiesList.length === 0)
      return (
        <p className="text-center text-gray-500 text-lg font-medium">
          No properties associated with this user.
        </p>
      );

    return (
      <div className="!p-6 rounded-lg space-y-6 !mb-5">
        {propertiesList.map((property) => (
          <Card
            key={property.id}
            className="text-card-foreground !mb-5 flex flex-col gap-6 rounded-xl border py-6 !p-8 bg-[#f3fbfa] !ms-10 w-full shadow-none border-none"
          >
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {property.image_id_link && 
                   !property.image_id_link.includes("400 Bad Request") && 
                   property.image_id_link !== "https://bcknd.sea-go.org/storage" && (
                    <img
                      src={property.image_id_link}
                      alt="Property"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <h3 className="text-lg font-semibold text-bg-primary">
                    {property.village || "N/A"}
                  </h3>
                </div>

                {/* جزء التحكم والأشخاص على اليمين */}
                <div className="flex items-center gap-4">
                  {property.people && (
                    <div className="flex items-center gap-2">
                      <FaUsers className="w-4 h-4 text-[#297878]" />
                      <span className="text-gray-700 font-medium">
                        {property.people} People
                      </span>
                    </div>
                  )}

                  {/* زر حذف الكارد الحالي بناءً على الـ id الخاص به */}
                  <Button
                    onClick={() => {
                      setSelectedCardId(property.id); // نمرر الـ id الخاص بهذا الكارد بعينه (مثل: 2465)
                      setIsDeleteDialogOpen(true);     // نفتح ديالوج التأكيد
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-[10px] !px-3 !py-1.5 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <FaTrash className="w-3 h-3" />
                    Delete User
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-gray-700">
                {property.unit && (
                  <div className="flex items-center gap-2">
                    <FaMapPin className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Unit: {property.unit}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) return <Loading />;
  if (error)
    return (
      <p className="text-center text-red-500 text-lg font-semibold">{error}</p>
    );

  return (
    <div className="min-h-screen !p-6">
      <Tabs defaultValue="owner" className="w-full">
        <TabsList className="flex flex-wrap !ms-3 w-[90%] gap-3 bg-transparent !my-6">
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 px-4 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="owner"
          >
            Owner ({propertiesList.length})
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 px-4 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="renter"
          >
            Renter ({rentsList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owner">
          <OwnerContent />
        </TabsContent>

        <TabsContent value="renter">
          <RenterTab rentsList={rentsList} />
        </TabsContent>
      </Tabs>

      {/* مودال تأكيد الحذف الموحد */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDeleteCard}
        name={`item #${selectedCardId}`}
        isDeleting={isDeleting}
      />
    </div>
  );
}