import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Loader2, Key } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChangeState } from "@/Hooks/useChangeState";

const UnitCodeManager = ({ codes, apiUrl, refetchCodes }) => {
  const { t } = useTranslation();

  // فلترة الأكواد لعرض النوع owner فقط
  const ownerCodes = codes?.appartment_codes?.filter(code => code.type === "owner") || [];

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t("ManageAccessCodes")}</h3>
          <p className="text-sm text-gray-500">{t("ManageAndUpdateAccessCodes")}</p>
        </div>

        <div className="rounded-full bg-teal-50 !px-4 !py-1.5 border border-teal-100">
          <span className="text-sm font-semibold text-teal-700">
            {/* عرض عدد أكواد الـ owner فقط */}
            {ownerCodes.length} {t("ActiveCodes")}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {/* عمل map على الأكواد المفلترة فقط */}
        {ownerCodes.map((code) => (
          <CodeItem
            key={code.id}
            code={code}
            apiUrl={apiUrl}
            refetchCodes={refetchCodes}
          />
        ))}
      </div>
    </div>
  );
};

const CodeItem = ({ code, apiUrl, refetchCodes }) => {
  const { t } = useTranslation();
  const [people, setPeople] = useState(code.people);
  const { changeState, loadingChange } = useChangeState();

  const hasChanges = Number(people) !== Number(code.people);

  const handleUpdate = async () => {
    const success = await changeState(
      `${apiUrl}/appartment/update_code/${code.id}`,
      t("CodeUpdatedSuccessfully"),
      { people: parseInt(people) }
    );

    if (success) {
      refetchCodes();
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-md border-none rounded-xl">
      <div className="flex items-center justify-between !p-4 gap-6">
        
        {/* الجزء الأيسر: أيقونة الكود والرقم */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {t("AccessCode")}
            </p>
            <span className="text-xl font-black text-gray-800 tracking-tight">
              {code.code}
            </span>
          </div>
        </div>

        {/* الجزء الأيمن: التحكم في العدد وزر الحفظ */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-50 !px-3 !py-2 rounded-lg">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              {t("PeopleCount")}
            </label>
            <Input
              type="number"
              min={1}
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-10 !ps-1 h-9 text-center font-bold border-none bg-white shadow-inner rounded-md"
            />
          </div>

          <Button
            onClick={handleUpdate}
            disabled={!hasChanges || loadingChange}
            className={`h-10 !px-6 font-semibold rounded-lg transition-all ${
              hasChanges 
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loadingChange ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("SaveChanges")
            )}
          </Button>
        </div>
      </div>

      {/* مؤشر التغييرات غير المحفوظة في الأسفل */}
      {hasChanges && (
        <div className="h-1.5 w-full bg-teal-500 animate-pulse" />
      )}
    </Card>
  );
};

export default UnitCodeManager;