import React, { useState, useEffect } from "react";
import { FaMapPin, FaUsers } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/Loading";
import RenterTab from "./RenterTab";

export default function Owner() {
  const { id } = useParams();
  const [propertiesList, setPropertiesList] = useState([]);
  const [rentsList, setRentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                {property.people && (
                  <div className="flex items-center gap-2">
                    <FaUsers className="w-4 h-4 text-[#297878]" />
                    <span className="text-gray-700 font-medium">
                      {property.people} People
                    </span>
                  </div>
                )}
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
    </div>
  );
}
