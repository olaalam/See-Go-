import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  ChevronDown,
  ChevronUp,
  User,
  ImageIcon,
  Home
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import DeleteDialog from "@/components/DeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, deleteRent, getRentStatus } from "@/utils/rentHelpers";
import GroupPeopleEditor from "./GroupPeopleEditor";
import RenterUserItem from "./RenterUserItem";

const RentGroupCard = ({ group, apiUrl, refetch, showUnit = false, showStatus = false }) => {
  const activeRenters = group.codes.filter((code) => code.user !== null && code.user_id !== null);
  const { t } = useTranslation();
  const token = useSelector((state) => state.auth?.token || localStorage.getItem("token"));
  const [showDetails, setShowDetails] = useState(false);
  const [isDeletingRent, setIsDeletingRent] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. تعديل الـ State هنا لتكون مصفوفة فارغة [] بدلاً من نص ""
  const [currentImages, setCurrentImages] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleDeleteRent = async () => {
    setIsDeletingRent(true);
    const primaryCode = group.codes[0];
    
    if (primaryCode) {
      const success = await deleteRent(apiUrl, token, primaryCode.id, t);
      if (success) {
        refetch();
      }
    }
    
    setIsDeletingRent(false);
    setIsDeleteDialogOpen(false);
  };

  // جلب الصور كمصفوفة
  const rentImages = group.codes[0]?.image_id_link || [];
  const hasValidImage = Array.isArray(rentImages) && rentImages.length > 0;
  
  // Get rent status and color
  const rentStatus = getRentStatus(group.from, group.to);
  const statusColors = {
    upcoming: "bg-blue-100 text-blue-700 border-blue-200",
    current: "bg-green-100 text-green-700 border-green-200",
    past: "bg-gray-100 text-gray-700 border-gray-200"
  };

  return (
    <Card className="overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-md border border-gray-200 rounded-xl">
      <div className="!p-4 sm:!p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
            <AvatarImage src={group.owner?.image || group.owner?.owner_image || "/default-avatar.png"} />
            <AvatarFallback>
              <User className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-gray-900">
                {group.owner?.name || group.owner?.owner_name || t("UnknownOwner")}
              </h4>
              {showStatus && (
                <Badge 
                  variant="outline" 
                  className={`${statusColors[rentStatus]} !p-2 text-xs font-semibold capitalize`}
                >
                  {t(rentStatus)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 !mt-1">
              <CalendarDays className="h-4 w-4" />
              <span>
                {formatDateTime(group.from)} - {formatDateTime(group.to)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 !mt-1">
              <Users className="h-4 w-4" />
              <span>{group.people} {t("People")}</span>
            </div>
            {showUnit && group.unit && (
              <div className="flex items-center gap-2 text-sm text-gray-500 !mt-1">
                <Home className="h-4 w-4" />
                <span>{t("Unit")}: {group.unit?.unit || t("N/A")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full sm:w-auto">
          {hasValidImage && (
            <Button
              variant="outline"
              className="flex-1 sm:flex-none !py-2 !px-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => {
                // 2. تم تصحيح اسم المتغير هنا إلى rentImages (بالجمع) وتمريره للـ State الجديدة
                setCurrentImages(rentImages);
                setIsImageModalOpen(true);
              }}
            >
              <ImageIcon className="h-4 w-4" />
              {t("View Id")} {rentImages.length > 1 && `(${rentImages.length})`}
            </Button>
          )}

          <Button
            variant="outline"
            className="flex-1 sm:flex-none !py-2 !px-4 flex items-center gap-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showDetails ? t("Hide Details") : t("Show Details")}
            <span className="bg-primary/10 text-primary !px-2 !py-0.5 rounded-full text-xs font-bold !ml-1">
              {activeRenters.length} / {group.codes.length}
            </span>
          </Button>
        </div>
      </div>

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDeleteRent}
        name={group.owner?.name || group.owner?.owner_name || t("UnknownOwner")}
        isDeleting={isDeletingRent}
      />

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="!p-4 !pb-0">
            <DialogTitle>{t("Rent id Image")}</DialogTitle>
          </DialogHeader>
          
          <div className="!p-4 bg-slate-50/50 overflow-y-auto space-y-6 max-h-[75vh]">
            {/* 3. تعديل الخريطة لتعمل على الـ State الجديدة currentImages */}
            {Array.isArray(currentImages) && currentImages.map((imgUrl, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                {currentImages.length > 1 && (
                  <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {t("Image")} {index + 1} / {currentImages.length}
                  </span>
                )}
                <img
                  src={imgUrl}
                  alt={`id-${index + 1}`}
                  className="max-w-full h-auto max-h-[65vh] object-contain rounded-md shadow-sm border border-slate-200"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 border-t border-gray-100 !p-4 sm:!p-6 space-y-4">
              <GroupPeopleEditor group={group} apiUrl={apiUrl} refetch={refetch} />
              <div className="grid gap-3">
                {activeRenters.length > 0 ? (
                  activeRenters.map((code) => (
                    <RenterUserItem
                      key={code.id}
                      code={code}
                      apiUrl={apiUrl}
                      refetch={refetch}
                      token={token}
                    />
                  ))
                ) : (
                  <div className="text-center !py-6 text-sm font-medium text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    {t("No users have claimed this code yet")}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default RentGroupCard;