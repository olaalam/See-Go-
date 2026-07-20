import React, { useState } from "react";
import axios from "axios";
import DataTable from "@/components/DataTableLayout";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import AddFieldSection from "@/components/AddFieldSection";
import { Loader2 } from "lucide-react";
import { useGet } from "@/Hooks/UseGet";

// ==== عدّل الـ base URL / الـ endpoints دي لو مختلفة عندك ====
const BASE_URL = "https://bcknd.sea-go.org/admin";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// بيحوّل الملف (File) لـ base64 string عشان نبعته جوه الـ JSON body
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // بيرجع "data:image/png;base64,...."
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// شكل الفورم بتاع الإضافة / التعديل، بيتبعت لـ AddFieldSection
// options بتاعة pool/beach/gate/inside_gate بتتجاب من endpoint واحد: gate_keeper_lists/{villageId}
const buildGateKeeperFields = ({ poolOptions, beachOptions, gateOptions, insideGateOptions }) => [
  { type: "file", name: "image", placeholder: "Image" },
  { type: "input", name: "name", placeholder: "Name" },
  { type: "input", inputType: "email", name: "email", placeholder: "Email" },
  { type: "input", name: "phone", placeholder: "Phone" },
  { type: "input", inputType: "password", name: "password", placeholder: "Password" },
  { type: "switch", name: "status", placeholder: "Active" },
  { type: "switch", name: "gate_visitors", placeholder: "Gate Visitors" },
  { type: "switch", name: "gate_entrance", placeholder: "Gate Entrance" },
  { type: "multi-select", name: "pool_ids", placeholder: "Pools", options: poolOptions },
  { type: "multi-select", name: "beach_ids", placeholder: "Beaches", options: beachOptions },
  { type: "multi-select", name: "gate_ids", placeholder: "Gates", options: gateOptions },
  { type: "multi-select", name: "inside_gate_ids", placeholder: "Inside Gates", options: insideGateOptions },
];

const emptyValues = {
  image: null,
  name: "",
  email: "",
  phone: "",
  password: "",
  status: "active",
  gate_visitors: "inactive",
  gate_entrance: "inactive",
  pool_ids: [],
  beach_ids: [],
  gate_ids: [],
  inside_gate_ids: [],
};

export default function GateKeeper({ villageId }) {
  const { data, loading, error, refetch } = useGet({
    url: villageId
      ? `${BASE_URL}/village/gate_keeper/${villageId}`
      : null,
  });

  // endpoint واحد بيرجع كل الـ lists مع بعض
  const { data: listsData } = useGet({
    url: villageId ? `${BASE_URL}/village/gate_keeper_lists/${villageId}` : null,
  });

  const poolOptions = React.useMemo(
    () => (listsData?.pools || []).map((p) => ({ value: p.id, label: p.name })),
    [listsData]
  );
  const beachOptions = React.useMemo(
    () => (listsData?.beaches || []).map((b) => ({ value: b.id, label: b.name })),
    [listsData]
  );
  const gateOptions = React.useMemo(
    () => (listsData?.gates || []).map((g) => ({ value: g.id, label: g.name })),
    [listsData]
  );
  const insideGateOptions = React.useMemo(
    () => (listsData?.inside_gates || []).map((g) => ({ value: g.id, label: g.name })),
    [listsData]
  );

  const gateKeeperFields = buildGateKeeperFields({
    poolOptions,
    beachOptions,
    gateOptions,
    insideGateOptions,
  });

  // ---- state بتاع الديالوجات ----
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  // تحضير البيانات وتوحيد حالة الـ status
  const gateKeepers = React.useMemo(() => {
    if (!data?.gate_keeper) return [];
    return data.gate_keeper.map((gate) => ({
      ...gate,
      status:
        gate.status === 1 ||
        String(gate.status).toLowerCase() === "active" ||
        String(gate.status).toLowerCase() === "true"
          ? "active"
          : "inactive",
    }));
  }, [data]);

  const columns = [
    {
      label: "Image",
      key: "image",
      render: (row) => (
        <div className="flex justify-center items-center">
          {row.image ? (
            <img
              src={row.image}
              alt={row.name}
              className="w-10 h-10 rounded-full object-cover border border-[#297878]/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#297878]/10 flex items-center justify-center text-xs font-semibold text-[#297878]">
              {row.name ? row.name.charAt(0).toUpperCase() : "G"}
            </div>
          )}
        </div>
      ),
    },
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Type", key: "type" },
    // status بقى Switch بدل الـ Badge، DataTableLayout بيعرضه تلقائي
    // طالما type: "switch" وواصله onToggleStatus
    { label: "Status", key: "status", type: "switch" },
  ];

  // ---------- Add ----------
  const handleAddClick = () => {
    setValues(emptyValues);
    setOpenAdd(true);
  };

  const handleAddFieldChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  // بيبني الـ body المطابق للـ schema المطلوب، ومحول الصورة لـ base64
  const buildPayload = async (existingImage) => {
    let imageBase64 = existingImage || "";
    if (values.image instanceof File) {
      imageBase64 = await fileToBase64(values.image);
    }

    return {
      name: values.name || "",
      email: values.email || "",
      phone: values.phone || "",
      status: values.status === "active",
      gate_visitors: values.gate_visitors === "active",
      gate_entrance: values.gate_entrance === "active",
      image: imageBase64,
      password: values.password || "",
      pool_ids: (values.pool_ids || []).map(Number),
      beach_ids: (values.beach_ids || []).map(Number),
      gate_ids: (values.gate_ids || []).map(Number),
      inside_gate_ids: (values.inside_gate_ids || []).map(Number),
      village_id: Number(villageId),
    };
  };

  const handleAddSave = async () => {
    if (!villageId) return;
    setIsSaving(true);
    try {
      const payload = await buildPayload();

      await axios.post(`${BASE_URL}/village/gate_keeper`, payload, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      setOpenAdd(false);
      refetch?.();
    } catch (err) {
      console.error("Failed to add gate keeper:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Edit ----------
  // بنفتح الديالوج فورًا وبنجيب تفاصيل العنصر كاملة (بالـ pool/beach/gate/inside_gates)
  // من gate_keeper_item/{id} عشان نعرف نملى الـ multi-select بالـ ids الصح
  const handleEdit = async (row) => {
    setSelectedRow(row);
    setOpenEdit(true);
    setIsLoadingItem(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/village/gate_keeper_item/${row.id}`,
        { headers: getAuthHeaders() }
      );
      const item = res.data?.gate_keeper?.[0] || row;

      setSelectedRow(item); // نحدّث selectedRow بالبيانات الكاملة (فيها الصورة الأصلية مثلاً)
      setValues({
        image: null, // فاضل عشان يقدر يرفع صورة جديدة، ولو مبعتش جديدة بنفضل باعتين القديمة (item.image)
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
        password: "", // سيبها فاضية، متبعتش غير لو الأدمن كتب باسورد جديد
        status: item.status === 1 || item.status === true ? "active" : "inactive",
        gate_visitors:
          item.gate_visitors === 1 || item.gate_visitors === true ? "active" : "inactive",
        gate_entrance:
          item.gate_entrance === 1 || item.gate_entrance === true ? "active" : "inactive",
        pool_ids: (item.pool || []).map((p) => p.id),
        beach_ids: (item.beach || []).map((b) => b.id),
        gate_ids: (item.gate || []).map((g) => g.id),
        inside_gate_ids: (item.inside_gates || []).map((g) => g.id),
      });
    } catch (err) {
      console.error("Failed to fetch gate keeper details:", err);
      setOpenEdit(false);
    } finally {
      setIsLoadingItem(false);
    }
  };

  const handleEditSave = async () => {
    if (!selectedRow) return;
    setIsSaving(true);
    try {
      const payload = await buildPayload(selectedRow.image);
      // لو الأدمن سايب حقل الباسورد فاضي وهو بيعدل، متبعتوش عشان متبوظش الباسورد الحالي
      if (!values.password) delete payload.password;

      await axios.post(
        `${BASE_URL}/village/gate_keeper_update/${selectedRow.id}`,
        payload,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        }
      );

      setOpenEdit(false);
      refetch?.();
    } catch (err) {
      console.error("Failed to update gate keeper:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Delete ----------
  const handleDelete = (row) => {
    setSelectedRow(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;
    setIsDeleting(true);
    try {
      await axios.delete(
        `${BASE_URL}/village/gate_keeper/${selectedRow.id}`,
        { headers: getAuthHeaders() }
      );
      setOpenDelete(false);
      setSelectedRow(null);
      refetch?.();
    } catch (err) {
      console.error("Failed to delete gate keeper:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- Toggle status من نفس الجدول (السويتش) ----------
  const handleToggleStatus = async (row, newStatusValue) => {
    try {
      await axios.post(
        `${BASE_URL}/village/gate_keeper/status/${row.id}`,
        { status: newStatusValue },
        { headers: getAuthHeaders() }
      );
      refetch?.();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-2 text-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-[#297878]" />
        <p className="text-sm font-medium">Loading Gate Keepers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
        Failed to load gate keepers data. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[10px] shadow-sm border border-gray-100 p-4 mt-4">
      <DataTable
        data={gateKeepers}
        columns={columns}
        searchKeys={["name", "email", "phone", "type"]}
        showAddButton={true}
        onAddClick={handleAddClick}
        showActions={true}
        showEditButton={true}
        showDeleteButton={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Add */}
      <EditDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        selectedRow={values} // بس عشان يعدي شرط "if (!selectedRow) return null" جوه EditDialog
        onSave={handleAddSave}
        isSaving={isSaving}
      >
        <AddFieldSection
          fields={gateKeeperFields}
          values={values}
          onChange={handleAddFieldChange}
        />
      </EditDialog>

      {/* Edit */}
      <EditDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        selectedRow={selectedRow}
        onSave={handleEditSave}
        isSaving={isSaving || isLoadingItem}
      >
        {isLoadingItem ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#297878]" />
          </div>
        ) : (
          <AddFieldSection
            fields={gateKeeperFields}
            values={values}
            onChange={handleAddFieldChange}
          />
        )}
      </EditDialog>

      {/* Delete */}
      <DeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        onDelete={confirmDelete}
        selectedRow={selectedRow}
        name={selectedRow?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}