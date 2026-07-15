"use client";
import { useEffect, useState, useMemo } from "react";
import DataTable from "@/components/DataTableLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { useSelector } from "react-redux";
import FullPageLoader from "@/components/Loading";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useGet } from "@/Hooks/UseGet";
import { useDelete } from "@/Hooks/useDelete";
// 1️⃣ استيراد usePut بدلاً من usePost
import { useChangeState } from "@/Hooks/useChangeState";
import { useAppartmentForm, AppartmentFormFields } from "./AppartmentForm";
import { Link, useSearchParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Eye } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Appartments = ({ villageId }) => {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "https://bcknd.sea-go.org";
  const apiUrl = baseUrl.endsWith("/admin") ? baseUrl : `${baseUrl}/admin`;
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [Appartments, setAppartments] = useState([]);
  const [selectedRow, setselectedRow] = useState(null);
  const [rowEdit, setRowEdit] = useState(null);
  const { deleteData, loadingDelete, isDeleting } = useDelete();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVillage, setSelectedVillage] = useState(villageId || "");

  useEffect(() => {
    setSelectedVillage(villageId || "");
  }, [villageId]);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = !villageId ? searchParams.get("search") || "" : "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const [isBansDialogOpen, setIsBansDialogOpen] = useState(false);
  const [activeBansData, setActiveBansData] = useState(null);

  const [banStatuses, setBanStatuses] = useState({
    all_status: false,
    entrance_status: false,
    selling_status: false,
    rent_status: false,
    visits_status: false,
    pool_status: false,
    beach_status: false,
    rent_code_status: false,
    options_status: false,
  });

  const handleSwitchChange = (key, value) => {
    setBanStatuses((prev) => ({ ...prev, [key]: value }));
  };

  const { data: villagesData } = useGet({
    url: `${apiUrl}/appartment/village_list`,
  });
  const villagesList = villagesData?.villages || [];

  const filterOptions = useMemo(
    () => [
      {
        key: "village_id",
        label: "Village",
        options: [
          { value: "all", label: "All Villages" },
          ...(Array.isArray(villagesList)
            ? villagesList.map((v) => ({
                value: String(v.id),
                label: v.name || String(v.id),
              }))
            : []),
        ],
      },
    ],
    [villagesList],
  );

  const initialFilters = useMemo(
    () => ({
      village_id: selectedVillage || "all",
    }),
    [selectedVillage],
  );

  const handleFilterChange = (key, value) => {
    if (key === "village_id") {
      setSelectedVillage(value === "all" ? "" : value);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);

      if (!villageId) {
        if (searchInput) {
          setSearchParams({ search: searchInput }, { replace: true });
        } else {
          setSearchParams({}, { replace: true });
        }
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput, setSearchParams, villageId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedVillage]);

  const queryParams = new URLSearchParams();
  queryParams.append("page", currentPage.toString());
  queryParams.append("per_page", "10");

  if (debouncedSearch) {
    queryParams.append("search", debouncedSearch);
  }

  const activeVillageId = selectedVillage;
  if (
    activeVillageId &&
    activeVillageId !== "undefined" &&
    activeVillageId !== "null"
  ) {
    queryParams.append("village_id", activeVillageId);
  }

  const {
    refetch: refetchAppartment,
    loading: loadingAppartmentGet,
    data: AppartmentData,
  } = useGet({
    url: `${apiUrl}/appartment/all_units?${queryParams.toString()}`,
  });

  const paginationInfo = AppartmentData?.appartments || AppartmentData;
  const totalCount = paginationInfo?.total || 0;
  const totalPages = paginationInfo?.last_page || 1;

  // 2️⃣ استخدام usePut بدلاً من usePost للـ Update
  const { changeState, loadingChange: loadingPut } = useChangeState();
  // 3️⃣ تمرير isEditOpen كمتغير رابع (enabled) لجلب القوائم من الـ APIs أثناء التعديل
  const {
    formData,
    fields,
    handleFieldChange,
    prepareFormData,
    loadingAppartment, // حالة التحميل الخاصة بالقوائم
  } = useAppartmentForm(apiUrl, true, rowEdit, isEditOpen);

  useEffect(() => {
    const appartmentList =
      paginationInfo?.data ||
      (Array.isArray(paginationInfo) ? paginationInfo : []);

    if (appartmentList && Array.isArray(appartmentList)) {
      const formatted = appartmentList.map((u) => ({
        id: u.id,
        name: u.unit || "—",
        type: u.type?.name || "—",
        map: u.location || "—",
        all_status: u.all_status,
        entrance_status: u.entrance_status,
        selling_status: u.selling_status,
        rent_status: u.rent_status,
        visits_status: u.visits_status,
        pool_status: u.pool_status,
        beach_status: u.beach_status,
        rent_code_status: u.rent_code_status,
        options_status: u.options_status,
        formatted_codes: u.formatted_codes || [],
      }));
      setAppartments(formatted);
    } else {
      setAppartments([]);
    }
  }, [AppartmentData]);

  const handleEdit = (Appartment) => {
    const appartmentList =
      paginationInfo?.data ||
      (Array.isArray(paginationInfo) ? paginationInfo : []);
    const fullAppartmentData = appartmentList.find(
      (o) => o.id === Appartment.id,
    );

    setselectedRow(Appartment);
    setIsEditOpen(true);

    // 4️⃣ إضافة village_id للـ rowEdit لكي يظهر في الـ Dropdown
    setRowEdit({
      name: fullAppartmentData?.unit || "",
      type:
        fullAppartmentData?.type?.id?.toString() ||
        fullAppartmentData?.appartment_type_id?.toString() ||
        "",
      appartment_type_id:
        fullAppartmentData?.type?.id?.toString() ||
        fullAppartmentData?.appartment_type_id?.toString() ||
        "",
      village_id: fullAppartmentData?.village_id?.toString() || "",
      map: fullAppartmentData?.location || "",
    });

    if (fullAppartmentData) {
      setBanStatuses({
        all_status:
          fullAppartmentData.all_status == 1 ||
          fullAppartmentData.all_status === true ||
          fullAppartmentData.all_status === "true",
        entrance_status:
          fullAppartmentData.entrance_status == 1 ||
          fullAppartmentData.entrance_status === true ||
          fullAppartmentData.entrance_status === "true",
        selling_status:
          fullAppartmentData.selling_status == 1 ||
          fullAppartmentData.selling_status === true ||
          fullAppartmentData.selling_status === "true",
        rent_status:
          fullAppartmentData.rent_status == 1 ||
          fullAppartmentData.rent_status === true ||
          fullAppartmentData.rent_status === "true",
        visits_status:
          fullAppartmentData.visits_status == 1 ||
          fullAppartmentData.visits_status === true ||
          fullAppartmentData.visits_status === "true",
        pool_status:
          fullAppartmentData.pool_status == 1 ||
          fullAppartmentData.pool_status === true ||
          fullAppartmentData.pool_status === "true",
        beach_status:
          fullAppartmentData.beach_status == 1 ||
          fullAppartmentData.beach_status === true ||
          fullAppartmentData.beach_status === "true",
        rent_code_status:
          fullAppartmentData.rent_code_status == 1 ||
          fullAppartmentData.rent_code_status === true ||
          fullAppartmentData.rent_code_status === "true",
        options_status:
          fullAppartmentData.options_status == 1 ||
          fullAppartmentData.options_status === true ||
          fullAppartmentData.options_status === "true",
      });
    }
  };

  const handleDelete = (Appartment) => {
    setselectedRow(Appartment);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow?.id) return;

    // 1. بناء كائن JSON مطابق تماماً للـ API بالصورة مع إضافة _method لمحاكاة الـ PUT
    const body = {
      _method: "PUT", // 💡 خداع السيرفر ليعتبر الطلب PUT وهو مرسل بـ POST
      unit: formData.en.name,
      appartment_type_id: Number(formData.en.type),
      village_id: Number(formData.en.village_id),
      location: formData.en.map || "",
      // تحويل الحالات لقيم Boolean حقيقية (true/false) كما يتوقعها الـ API بالصورة
      all_status: !!banStatuses.all_status,
      entrance_status: !!banStatuses.entrance_status,
      selling_status: !!banStatuses.selling_status,
      rent_status: !!banStatuses.rent_status,
      visits_status: !!banStatuses.visits_status,
      pool_status: !!banStatuses.pool_status,
      beach_status: !!banStatuses.beach_status,
      rent_code_status: !!banStatuses.rent_code_status,
      options_status: !!banStatuses.options_status,
    };

    const url = `${apiUrl}/appartment/update/${selectedRow.id}`;

    // 2. إرسال الطلب عبر الـ Hook بدون تعديله[cite: 1]
    const result = await changeState(
      url,
      "Apartment updated successfully!",
      body,
    );

    // 3. إذا تمت العملية بنجاح (result لا يساوي null)[cite: 1]
    if (result) {
      setIsEditOpen(false);
      setIsBansDialogOpen(false);
      setselectedRow(null);
      refetchAppartment(); // إعادة جلب البيانات لتحديث الجدول[cite: 2]
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteData(
      `${apiUrl}/appartment/delete/${selectedRow.id}`,
      `${selectedRow.name} Deleted Success.`,
    );
    if (success) {
      setIsDeleteOpen(false);
      setAppartments(
        Appartments.filter((Appartment) => Appartment.id !== selectedRow.id),
      );
    }
  };

  const openBansDialog = (row) => {
    const appartmentList =
      paginationInfo?.data ||
      (Array.isArray(paginationInfo) ? paginationInfo : []);
    const fullAppartmentData = appartmentList.find((o) => o.id === row.id);

    setActiveBansData(row);
    setselectedRow(row);

    setRowEdit({
      name: fullAppartmentData?.unit || "",
      type:
        fullAppartmentData?.type?.id?.toString() ||
        fullAppartmentData?.appartment_type_id?.toString() ||
        "",
      appartment_type_id:
        fullAppartmentData?.type?.id?.toString() ||
        fullAppartmentData?.appartment_type_id?.toString() ||
        "",
      village_id: fullAppartmentData?.village_id?.toString() || "",
      map: fullAppartmentData?.location || "",
    });

    if (fullAppartmentData) {
      setBanStatuses({
        all_status:
          fullAppartmentData.all_status == 1 ||
          fullAppartmentData.all_status === true ||
          fullAppartmentData.all_status === "true",
        entrance_status:
          fullAppartmentData.entrance_status == 1 ||
          fullAppartmentData.entrance_status === true ||
          fullAppartmentData.entrance_status === "true",
        selling_status:
          fullAppartmentData.selling_status == 1 ||
          fullAppartmentData.selling_status === true ||
          fullAppartmentData.selling_status === "true",
        rent_status:
          fullAppartmentData.rent_status == 1 ||
          fullAppartmentData.rent_status === true ||
          fullAppartmentData.rent_status === "true",
        visits_status:
          fullAppartmentData.visits_status == 1 ||
          fullAppartmentData.visits_status === true ||
          fullAppartmentData.visits_status === "true",
        pool_status:
          fullAppartmentData.pool_status == 1 ||
          fullAppartmentData.pool_status === true ||
          fullAppartmentData.pool_status === "true",
        beach_status:
          fullAppartmentData.beach_status == 1 ||
          fullAppartmentData.beach_status === true ||
          fullAppartmentData.beach_status === "true",
        rent_code_status:
          fullAppartmentData.rent_code_status == 1 ||
          fullAppartmentData.rent_code_status === true ||
          fullAppartmentData.rent_code_status === "true",
        options_status:
          fullAppartmentData.options_status == 1 ||
          fullAppartmentData.options_status === true ||
          fullAppartmentData.options_status === "true",
      });
    }

    setIsBansDialogOpen(true);
  };

  const columns = [
    {
      key: "name",
      label: "Unit",
      render: (row) => (
        <Link
          to={`/units/details/${row.id}`}
          className="text-blue-600 hover:underline font-semibold"
        >
          {row.name || "—"}
        </Link>
      ),
    },
    {
      key: "bans_view",
      label: "Ban Statuses",
      render: (row) => (
        <button
          onClick={() => openBansDialog(row)}
          className="inline-flex items-center gap-1.5 !px-3 !py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors text-xs font-bold"
        >
          <Eye size={14} />
          View Statuses
        </button>
      ),
    },
    {
      key: "formatted_codes",
      label: "Codes",
      render: (row) => {
        if (row.formatted_codes && row.formatted_codes.code) {
          return (
            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50/50 border border-blue-100 !px-2.5 !py-1 rounded-lg">
              {row.formatted_codes.code}
            </span>
          );
        }
        if (
          Array.isArray(row.formatted_codes) &&
          row.formatted_codes.length > 0
        ) {
          return (
            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50/50 border border-blue-100 !px-2.5 !py-1 rounded-lg">
              {row.formatted_codes[0].code}
            </span>
          );
        }
        return <span className="text-gray-400 font-normal">—</span>;
      },
    },
    { key: "type", label: "Type" },
    { key: "map", label: "Location" },
  ];

  if (isLoading || loadingPut) {
    return <FullPageLoader />;
  }

  const banKeys = [
    "all_status",
    "entrance_status",
    "selling_status",
    "rent_status",
    "visits_status",
    "pool_status",
    "beach_status",
    "rent_code_status",
    "options_status",
  ];

  return (
    <div className="p-4">
      <DataTable
        data={Appartments}
        columns={columns}
        addRoute="/units/add"
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions={true}
        showFilter={true}
        filterOptions={filterOptions}
        initialFilters={initialFilters}
        onFilterChange={handleFilterChange}
        showSearch={true}
        pageDetailsRoute={false}
        additionalLink="/units/create_code"
        additionalLinkLabel="Create Code"
        isBackendPagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(page) => setCurrentPage(page)}
        onSearchChange={(val) => setSearchInput(val)}
      />

      <Dialog open={isBansDialogOpen} onOpenChange={setIsBansDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl !p-6 bg-white">
          <DialogHeader className="border-b !pb-3">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Ban Statuses</span>
              <span className="text-teal-600 font-black bg-teal-50 !px-2 !py-0.5 rounded-lg text-sm">
                #{activeBansData?.name}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 !py-4 max-h-[50vh] overflow-y-auto !pr-1">
            {activeBansData &&
              banKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between !p-3 border border-slate-100 rounded-xl bg-slate-50/50 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-600">
                    {key}
                  </span>
                  <div>
                    <Switch
                      checked={banStatuses[key]}
                      onCheckedChange={(checked) =>
                        handleSwitchChange(key, checked)
                      }
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-end border-t !pt-4 mt-2">
            <button
              onClick={handleSave}
              disabled={loadingPut}
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 !px-5 !py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {loadingPut ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedRow && (
        <>
          <EditDialog
            title="Edit Unit"
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            onCancel={() => setIsEditOpen(false)}
            onChange={() => {}}
            isLoading={loadingAppartmentGet || loadingAppartment} // 👈 الديالوج سيتكفل بالتحميل بشكل كامل وصحيح هنا
          >
            <div className="w-full max-h-[60vh] p-4 overflow-y-auto">
              <Tabs defaultValue="english" className="w-full">
                <TabsContent value="english">
                  <AppartmentFormFields
                    fields={fields}
                    formData={formData}
                    handleFieldChange={handleFieldChange}
                    // ❌ امسحي هذا السطر تماماً لمنع الفورم من الانهيار وإعادة البناء عند الاختيار
                  />
                </TabsContent>
              </Tabs>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            isDeleting={isDeleting}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
            isLoading={loadingDelete}
          />
        </>
      )}
    </div>
  );
};

export default Appartments;
