import React, { useState, useEffect } from "react";
import { FaPhone, FaEnvelope, FaUser, FaHome, FaMapPin, FaMoneyBillWave } from "react-icons/fa";
import Loading from "@/components/Loading";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function Owner() {
  const [propertiesList, setPropertiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    async function fetchOwnerAndPropertyData() {
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
          `https://bcknd.sea-go.org/admin/user/item/${id}`,
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

        // --- Start of the fix ---
        const properties = json.properties || [];
        const offers = json.offers || [];

        // Map offers to their respective properties
        const propertiesWithOffers = properties.map((property) => {
          const associatedOffers = offers.filter(
            (offer) =>
              offer.village === property.village && offer.unit === property.unit
          );
          return { ...property, offers: associatedOffers };
        });
        // --- End of the fix ---

        if (propertiesWithOffers.length > 0) {
          setPropertiesList(propertiesWithOffers);
        } else {
          setPropertiesList([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Failed to load owner or property data.");
      } finally {
        setLoading(false);
      }
    }

    fetchOwnerAndPropertyData();
  }, [id]);

  if (loading) return <Loading />;
  if (error)
    return (
      <p className="text-center text-red-500 text-lg font-semibold">{error}</p>
    );
  if (propertiesList.length === 0)
    return (
      <p className="text-center text-gray-500 text-lg font-medium">
        No properties associated with this user.
      </p>
    );

  return (
    <div className="min-h-screen !p-6">
      <div className=" !p-6 rounded-lg space-y-6 !mb-5  ">
        {propertiesList.map((property) => (
          <Card
            key={property.id}
            className="text-card-foreground !mb-5 flex flex-col gap-6 rounded-xl border py-6 !p-8 bg-[#f3fbfa] !ms-10 w-full shadow-none border-none"
          >
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {property.cover_image && (
                    <img
                      src={property.cover_image}
                      alt="Village Cover"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-bg-primary">
                    {property.village || "N/A"}
                  </h3>
                </div>
                {/* Check if property.offers exists and map through them */}
<div className="flex flex-col gap-2">
  {property.offers && property.offers.length > 0 ? (
    <ul className="space-y-1">
      {property.offers.map((offer) => (
        <li key={offer.id} className="flex flex-col gap-1 text-sm">
          {offer.price_day && (
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="w-4 h-4 text-cyan-600" />
              <span className="text-gray-700 font-medium">
                Rent/Day: {offer.price_day} EGP
              </span>
            </div>
          )}
          {offer.price_month && (
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="w-4 h-4 text-cyan-600" />
              <span className="text-gray-700 font-medium">
                Rent/Month: {offer.price_month} EGP
              </span>
            </div>
          )}
          {offer.price && (
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="w-4 h-4 text-cyan-600" />
              <span className="text-gray-700 font-medium">
                For Sale: {offer.price} EGP
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  ) : (
    <span className="text-sm text-gray-500 italic">No offers available</span>
  )}
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
    </div>
  );
}