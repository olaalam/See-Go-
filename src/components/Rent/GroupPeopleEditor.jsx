import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Loader2, Key } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useChangeState } from "@/Hooks/useChangeState";
import DeleteDialog from "@/components/DeleteDialog";
import { formatDateTimeForInput, formatDateForBackend, deleteCode } from "@/utils/rentHelpers";

const GroupPeopleEditor = ({ group, apiUrl, refetch }) => {
  const { t } = useTranslation();
  const token = useSelector((state) => state.auth?.token || localStorage.getItem("token"));

  const [people, setPeople] = useState(group.codes[0]?.people || 1);
  const [fromDate, setFromDate] = useState(formatDateTimeForInput(group.from));
  const [toDate, setToDate] = useState(formatDateTimeForInput(group.to));

  const [isDeletingCode, setIsDeletingCode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { changeState, loadingChange } = useChangeState();

  const hasChanges =
    Number(people) !== Number(group.codes[0]?.people) ||
    fromDate !== formatDateTimeForInput(group.from) ||
    toDate !== formatDateTimeForInput(group.to);

  const handleUpdate = async () => {
    const primaryCode = group.codes[0];
    if (!primaryCode) return;

    const res = await changeState(
      `${apiUrl}/appartment/update_code/${primaryCode.id}`,
      t("Code Updated Successfully"),
      {
        people: parseInt(people),
        from: formatDateForBackend(fromDate), 
        to: formatDateForBackend(toDate)      
      }
    );

    if (res) {
      refetch();
    }
  };

  const handleDeleteCode = async () => {
    const primaryCode = group.codes[0];
    if (!primaryCode) return;

    setIsDeletingCode(true);
    const success = await deleteCode(
      apiUrl, 
      token, 
      primaryCode.code, 
      primaryCode.user_id || primaryCode.user?.id,
      t
    );
    
    if (success) {
      refetch();
    }
    
    setIsDeletingCode(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white !p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t("Access Codes")} ({group.codes.length})
          </h5>
          <span className="text-lg font-black text-gray-800 tracking-tight">
            {group.codes[0]?.code}
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
        <div className="flex items-center gap-2 bg-gray-50 !px-2 !py-1 rounded-md border border-gray-100">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            {t("People")}
          </label>
          <Input
            type="number"
            min={1}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            className="w-14 h-8 text-center font-bold border-none bg-white shadow-inner rounded-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 !px-2 !py-1 rounded-md border border-gray-100">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            {t("From")}
          </label>
          <Input
            type="datetime-local" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 text-xs font-medium border-none bg-white shadow-inner rounded-sm w-40 md:w-48"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-50 !px-2 !py-1 rounded-md border border-gray-100">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            {t("To")}
          </label>
          <Input
            type="datetime-local" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 text-xs font-medium border-none bg-white shadow-inner rounded-sm w-40 md:w-48"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpdate}
            disabled={!hasChanges || loadingChange || isDeletingCode}
            size="sm"
            className={`h-8 font-semibold rounded-md transition-all ${hasChanges
              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed !py-3 !px-4"
              }`}
          >
            {loadingChange ? <Loader2 className="h-3 w-3 animate-spin" /> : <Edit className="h-3 w-3 mr-1" />}
            {t("Edit")}
          </Button>

          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={loadingChange || isDeletingCode}
            size="sm"
            variant="destructive"
            className="h-8 !py-3 !px-4 font-semibold rounded-md transition-all bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeletingCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 !mr-1" />}
            {t("Delete")}
          </Button>
        </div>

        <DeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onDelete={handleDeleteCode}
          name={group.codes[0]?.code || t("Code")}
          isDeleting={isDeletingCode}
        />
      </div>
    </div>
  );
};

export default GroupPeopleEditor;
