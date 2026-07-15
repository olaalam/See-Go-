import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Loader2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import DeleteDialog from "@/components/DeleteDialog";
import { deleteRent } from "@/utils/rentHelpers";

const RenterUserItem = ({ code, apiUrl, refetch, token }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteRent(apiUrl, token, code.id, t);
    
    if (success) {
      refetch();
    }
    
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  const user = code.user;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white !p-4 rounded-lg border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 ring-1 ring-primary/20">
          <AvatarImage src={user?.image || user?.image_link || "/default-avatar.png"} />
          <AvatarFallback>
            <User className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-bold text-gray-800">
            {user?.name || t("User")}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 !mt-1">
            {user?.email && <span className="font-medium text-gray-600">{user.email}</span>}
            {user?.phone && <span className="font-mono text-gray-500">{user.phone}</span>}
          </div>
        </div>
      </div>

      <Button
        onClick={() => setIsDeleteDialogOpen(true)}
        disabled={isDeleting}
        size="sm"
        variant="ghost"
        className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md !px-3 font-semibold"
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
        {t("Delete Renter")}
      </Button>

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDelete}
        name={user?.name || t("User")}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default RenterUserItem;
