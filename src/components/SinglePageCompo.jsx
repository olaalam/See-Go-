import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  FileText,
  Home,
  Users,
  Phone,
  Clock,
  Globe,
  Briefcase, // Import Briefcase for Service Provider
} from "lucide-react";
import VAdmin from "@/Pages/Villages/VAdmin";
import PAdmin from "@/Pages/Providers/PAdmin";
import { useLocation, useParams } from "react-router-dom";
import Units from "@/Pages/Villages/Units";
import Gallery from "./Gallery";

// Import new components for Owner, Visits, and Services tabs (you'll need to create these)
import Owner from "@/Pages/Users/Owner"; // Assuming this path
import Services from "@/Pages/Users/Services"; // Assuming this path
import InvoiceCard from "@/Pages/Invoice/Invoice";
import ServiceProvider from "@/Pages/Mall/MService"; // Assuming you have this component for mall service providers
import InvoiceList from "@/Pages/Invoice/InvoiceList";

const formatTime = (time) => {
  if (!time) return "";
  try {
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

export default function VillageDetailsCard({
  data,
  status = "Active",
  entityType, // This prop is used to determine if it's a "village"
}) {
  const location = useLocation();
  const { id } = useParams(); // <-- Get ID from URL parameters

  // Determine page type based on URL
  const isUserSinglePage = location.pathname.startsWith(
    "/users/single-page-u/"
  );
  const isProviderPage = location.pathname.includes("/providers/");
  const isMallSinglePage = location.pathname.startsWith("/mall/single-page-m/"); // New condition for mall page

  if (!data) return null;
  console.log("VillageDetailsCard data:", data);
  console.log("Entity ID from URL params:", id);
  console.log("Is Mall Single Page:", isMallSinglePage); // Log the new variable

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid !ms-3 w-[90%] grid-cols-5 gap-6 bg-transparent !my-6">
          <TabsTrigger
            className="rounded-[10px] border text-bg-primary py-2 transition-all
                      data-[state=active]:bg-bg-primary data-[state=active]:text-white
                      hover:bg-teal-100 hover:text-teal-700"
            value="info"
          >
            Information
          </TabsTrigger>

          {isUserSinglePage ? (
            <>
              <TabsTrigger
                className="rounded-[10px] border text-bg-primary py-2 transition-all
                          data-[state=active]:bg-bg-primary data-[state=active]:text-white
                          hover:bg-teal-100 hover:text-teal-700"
                value="owner"
              >
                Property
              </TabsTrigger>

              <TabsTrigger
                className="rounded-[10px] border text-bg-primary py-2 transition-all
                          data-[state=active]:bg-bg-primary data-[state=active]:text-white
                          hover:bg-teal-100 hover:text-teal-700"
                value="services"
              >
                Services
              </TabsTrigger>
            </>
          ) : isMallSinglePage ? ( // New condition for Mall Single Page
            <>
              <TabsTrigger
                className="rounded-[10px] border text-bg-primary py-2 transition-all
                          data-[state=active]:bg-bg-primary data-[state=active]:text-white
                          hover:bg-teal-100 hover:text-teal-700"
                value="gallery" // "Images" for malls
              >
                Images
              </TabsTrigger>
              <TabsTrigger
                className="rounded-[10px] border text-bg-primary py-2 transition-all
                          data-[state=active]:bg-bg-primary data-[state=active]:text-white
                          hover:bg-teal-100 hover:text-teal-700"
                value="service-providers" // "Service Provider" for malls
              >
                Service Providers
              </TabsTrigger>
              {/* Add more specific tabs for malls if needed, e.g., 'Shops', 'Events' */}
            </>
          ) : (
            // Default tabs for Village or Provider
            <>
              <TabsTrigger
                className="rounded-[10px] border text-bg-primary py-2 transition-all
                          data-[state=active]:bg-bg-primary data-[state=active]:text-white
                          hover:bg-teal-100 hover:text-teal-700"
                value="admin"
              >
                Admin Users
              </TabsTrigger>
              <TabsTrigger
                className="rounded-[10px] border text-bg-primary py-2 transition-all
                          data-[state=active]:bg-bg-primary data-[state=active]:text-white
                          hover:bg-teal-100 hover:text-teal-700"
                value="gallery"
              >
                Images
              </TabsTrigger>

              {entityType === "village" && ( // Only show for village entityType
                <>
                  <TabsTrigger
                    className="rounded-[10px] border text-bg-primary py-2 transition-all
                                data-[state=active]:bg-bg-primary data-[state=active]:text-white
                                hover:bg-teal-100 hover:text-teal-700"
                    value="units"
                  >
                    Units
                  </TabsTrigger>
                  <TabsTrigger
                    className="rounded-[10px] border text-bg-primary py-2 transition-all
                                data-[state=active]:bg-bg-primary data-[state=active]:text-white
                                hover:bg-teal-100 hover:text-teal-700"
                    value="invoice"
                  >
                    Invoices
                  </TabsTrigger>
                </>
              )}
            </>
          )}
        </TabsList>

        <TabsContent value="info">
          <Card className="!p-8 bg-[#f3fbfa] !ms-10 w-full shadow-none border-none">
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {data.image && (
                    <img
                      src={data.image}
                      alt={data.name || "Entity"}
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
                {data.units && ( // This is typically for villages
                  <div className="flex items-center gap-2">
                    <Home className="w-4 font-semibold h-4 text-[#297878]" />
                    <span>Units: {data.units}</span>
                  </div>
                )}
                {data.population && ( // This is typically for villages
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
                {data.village && ( // For users or providers possibly linked to a village
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
                {data.email && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 font-semibold h-4 text-[#297878]" />{" "}
                    <span>Email: {data.email}</span>{" "}
                  </div>
                )}
                {data.user_type && ( // For users
                  <div className="flex items-center gap-2">
                    <Users className="w-4 font-semibold h-4 text-[#297878]" />{" "}
                    <span>User Type: {data.user_type}</span>{" "}
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

        {isUserSinglePage ? (
          <>
            <TabsContent value="owner">
              <Owner data={data} />
            </TabsContent>
            <TabsContent value="services">
              <Services data={data} />
            </TabsContent>
          </>
        ) : isMallSinglePage ? ( // New content for Mall Single Page
          <>
            <TabsContent value="gallery">
              <Gallery /> {/* Gallery component can be reused for mall images */}
            </TabsContent>
            <TabsContent value="service-providers">
              {/* You'll need to create a component like MallServiceProviders or similar */}
              <ServiceProvider mallId={id} />
            </TabsContent>
          </>
        ) : (
          // Default content for Village or Provider
          <>
            <TabsContent value="admin">
              {isProviderPage ? <PAdmin /> : <VAdmin />}
            </TabsContent>
            <TabsContent value="gallery">
              <Gallery />
            </TabsContent>
            {entityType === "village" && ( // Only show for village entityType
              <>
                <TabsContent value="units">
                  <Units />
                </TabsContent>
                <TabsContent value="invoice">
                  <InvoiceList villageId={id} />
                </TabsContent>
              </>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}