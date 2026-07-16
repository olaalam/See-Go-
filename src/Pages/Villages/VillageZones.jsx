import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useGet } from "@/Hooks/UseGet";

export default function VillageZones({ villageId }) {
  const id = villageId || useParams().id;
  
  // استدعاء الهوك وجلب بيانات المناطق الخاصة بالقرية
  const { data, loading, error } = useGet({
    url: `https://bcknd.sea-go.org/admin/village/village_zones/${id}`,
  });

  // معالجة وحل اسم الـ Zone بشكل آمن في حال وجود مصفوفات أو قيم null
  const getZoneName = (zone) => {
    if (!zone) return "—";
    
    if (Array.isArray(zone.name)) {
      const validName = zone.name.find((item) => item !== null);
      if (validName) {
        if (typeof validName === "object") {
          return validName.value || validName.name || `Zone #${zone.id}`;
        }
        return validName;
      }
    }
    
    if (typeof zone.name === "string") return zone.name;
    return `Zone #${zone.id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center !py-16 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-bg-primary" />
        <span className="!ms-3 text-sm text-gray-500 font-medium">Loading Village Zones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 justify-center !py-16 w-full">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Failed to load village zones. Please try again later.</span>
      </div>
    );
  }

  const zones = data?.zone_village || [];

  return (
    <div className="w-full !ms-10">
      <div className="flex items-center gap-2 !mb-6">
        <Layers className="w-5 h-5 text-bg-primary" />
        <h3 className="text-lg font-bold text-bg-primary">
          Village Zones ({zones.length})
        </h3>
      </div>

      {zones.length === 0 ? (
        <div className="text-center !py-16 bg-[#f3fbfa] rounded-[15px] border border-dashed border-teal-200 w-full max-w-4xl">
          <p className="text-gray-400 italic">No zones found for this village.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {zones.map((zone) => (
            <Card 
              key={zone.id} 
              className="border border-teal-100 bg-[#fefefe] hover:shadow-md transition-all duration-200 rounded-[15px]"
            >
              <CardContent className="!p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start border-b !pb-3 border-teal-50">
                  <div className="flex items-center gap-2">
                    <div className="!p-2 bg-teal-50 rounded-lg text-bg-primary">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-bg-primary text-sm">
                      {getZoneName(zone)}
                    </span>
                  </div>
                  <span className="text-xs bg-teal-100 text-teal-800 !px-2.5 !py-1 rounded-full font-bold">
                    ID: {zone.id}
                  </span>
                </div>
                
                {/* تفاصيل إضافية إن وُجدت مستقبلاً في الـ API */}
                <div className="text-xs text-gray-500 flex flex-col gap-1 !mt-1">
                  {zone.name.en && (
                    <p>Name: <strong className="text-bg-primary font-medium">{zone.name.en}</strong></p>
                  )}

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}