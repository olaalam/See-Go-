import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, FileText, Home, Users, Phone, Clock, Globe } from "lucide-react";
import VAdmin from "@/Pages/Villages/VAdmin";
import PAdmin from "@/Pages/Providers/PAdmin";
import { useLocation } from "react-router-dom";

const formatTime = (time) => {
  if (!time) return "";
  try {
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  } catch (error) {
    return time; 
  }
};

export default function VillageDetailsCard({ data, status = "Active" }) {
    const location = useLocation();
  const isProviderPage = location.pathname.includes("/providers/");
  if (!data) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-center text-xl text-bg-primary font-semibold mb-4">
        Single Page View
      </h2>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid !ms-3 w-[90%] grid-cols-2 gap-6 bg-transparent !my-6">
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                  data-[state=active]:bg-bg-primary data-[state=active]:text-white
                  hover:bg-teal-100 hover:text-teal-700"
            value="info"
          >
            Information
          </TabsTrigger>
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                  data-[state=active]:bg-bg-primary data-[state=active]:text-white
                  hover:bg-teal-100 hover:text-teal-700"
            value="admin"
          >
            Admin Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="!p-8 bg-[#f3fbfa] !ms-10 w-full shadow-none border-none">
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {data.image && (
                    <img
                      src={data.image}
                      alt="Village"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-bg-primary">
                    {data.name}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className={`!px-4 !py-1.5 cursor-pointer rounded-[10px] ${
                    status === "Active"
                      ? "bg-green-100 hover:bg-gray-300 text-green-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-300"
                  }`}
                >
                  {status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-bg-primary">
                {data.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Location: {data.location}</span>
                  </div>
                )}
                {data.description && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Description: {data.description}</span>
                  </div>
                )}
                {data.units && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Units: {data.units}</span>
                  </div>
                )}
                {data.population && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Population: {data.population}</span>
                  </div>
                )}
                {data.zone && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Zone: {data.zone}</span>
                  </div>
                )}
                {data.village && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Village: {data.village}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Phone: {data.phone}</span>
                  </div>
                )}
                {data.open_from && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Open From: {formatTime(data.open_from)}</span>
                  </div>
                )}
                {data.open_to && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Open To: {formatTime(data.open_to)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          {isProviderPage ? <PAdmin /> : <VAdmin />}
        </TabsContent>
      </Tabs>
    </div>
  );
}