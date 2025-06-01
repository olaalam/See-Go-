import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VCover from "@/Pages/Villages/VCover";
import { FaImage, FaUser } from "react-icons/fa";
import VGallery from "@/Pages/Villages/VGallery";
import PCover from "@/Pages/Providers/PCover";
import PGallery from "@/Pages/Providers/PGallery";
import MGallery from "@/Pages/Mall/MGallery";
import MCover from "@/Pages/Mall/MCover";

export default function Gallery() {
  const isProviderPage = location.pathname.includes("/providers/");
  const isVillagePage = location.pathname.includes("/villages/");

  return (
    <>
      <Tabs defaultValue="cover" className="w-full">
        <TabsList className="grid w-[50%] grid-cols-2 gap-6 bg-transparent my-6 !m-auto">
          <TabsTrigger
            value="cover"
            className="rounded-[10px] border text-bg-primary py-2 transition-all
              data-[state=active]:bg-bg-primary data-[state=active]:text-white
              hover:bg-teal-100 hover:text-teal-700"
          >
            Profile/Cover
          </TabsTrigger>

          <TabsTrigger
            value="profile"
            className="rounded-[10px] border text-bg-primary py-2 transition-all
              data-[state=active]:bg-bg-primary data-[state=active]:text-white
              hover:bg-teal-100 hover:text-teal-700"
          >
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {isProviderPage ? (
            <PGallery />
          ) : isVillagePage ? (
            <VGallery />
          ) : (
            <MGallery />
          )}
        </TabsContent>

        <TabsContent value="cover">
          {isProviderPage ? (
            <PCover />
          ) : isVillagePage ? (
            <VCover />
          ) : (
            <MCover />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
