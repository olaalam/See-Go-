import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FaMapPin, FaCalendar, FaUsers } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";

export default function RenterTab({ rentsList = [] }) {
  // Filter rents based on status
  const currentRents = rentsList.filter(rent => rent.status === "Current");
  const upcomingRents = rentsList.filter(rent => rent.status === "Upcoming");
  const pastRents = rentsList.filter(rent => rent.status === "Past");

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Current":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      case "Upcoming":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "Past":
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const RentCard = ({ rent }) => (
    <Card
      key={rent.id}
      className="text-card-foreground !mb-5 flex flex-col gap-6 rounded-xl border py-6 !p-8 bg-[#f3fbfa] !ms-10 w-full shadow-none border-none"
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {rent.image_id_link && 
             !rent.image_id_link.includes("400 Bad Request") && 
             rent.image_id_link !== "https://bcknd.sea-go.org/storage" && (
              <img
                src={rent.image_id_link}
                alt="Rental"
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <h3 className="text-lg font-semibold text-bg-primary">
              {rent.village || "N/A"}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`!px-4 !py-1.5 cursor-pointer rounded-[10px] ${getStatusColor(
              rent.status
            )}`}
          >
            {rent.status}
          </Badge>
        </div>
        <div className="space-y-2 text-gray-700">
          {rent.unit && (
            <div className="flex items-center gap-2">
              <FaMapPin className="w-4 h-4 text-[#297878]" />
              <span className="font-semibold">Unit: {rent.unit}</span>
            </div>
          )}
          {rent.people && (
            <div className="flex items-center gap-2">
              <FaUsers className="w-4 h-4 text-[#297878]" />
              <span>People: {rent.people}</span>
            </div>
          )}
          {rent.from && (
            <div className="flex items-center gap-2">
              <FaCalendar className="w-4 h-4 text-[#297878]" />
              <span>From: {formatDate(rent.from)}</span>
            </div>
          )}
          {rent.to && (
            <div className="flex items-center gap-2">
              <FaCalendar className="w-4 h-4 text-[#297878]" />
              <span>To: {formatDate(rent.to)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen !p-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap !ms-3 w-[90%] gap-3 bg-transparent !my-6">
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 px-4 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="all"
          >
            All ({rentsList.length})
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 px-4 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="current"
          >
            Current ({currentRents.length})
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 px-4 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="upcoming"
          >
            Upcoming ({upcomingRents.length})
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 px-4 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="past"
          >
            Past ({pastRents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {rentsList.length > 0 ? (
            <div className="!p-6 rounded-lg space-y-6 !mb-5">
              {rentsList.map((rent) => (
                <RentCard key={rent.id} rent={rent} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg font-medium">
              No rentals found.
            </p>
          )}
        </TabsContent>

        <TabsContent value="current">
          {currentRents.length > 0 ? (
            <div className="!p-6 rounded-lg space-y-6 !mb-5">
              {currentRents.map((rent) => (
                <RentCard key={rent.id} rent={rent} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg font-medium">
              No current rentals.
            </p>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcomingRents.length > 0 ? (
            <div className="!p-6 rounded-lg space-y-6 !mb-5">
              {upcomingRents.map((rent) => (
                <RentCard key={rent.id} rent={rent} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg font-medium">
              No upcoming rentals.
            </p>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastRents.length > 0 ? (
            <div className="!p-6 rounded-lg space-y-6 !mb-5">
              {pastRents.map((rent) => (
                <RentCard key={rent.id} rent={rent} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg font-medium">
              No past rentals.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
