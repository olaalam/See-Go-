import React from "react";
import DataTable from "@/components/DataTableLayout"; 
import { Loader2 } from "lucide-react";
import { useGet } from "@/Hooks/UseGet";

export default function GateKeeper({ villageId }) {
  const { data, loading, error } = useGet({
    url: villageId ? `https://bcknd.sea-go.org/admin/village/gate_keeper/${villageId}` : null,
  });

  // تحضير البيانات وتوحيد حالة الـ status
  const gateKeepers = React.useMemo(() => {
    if (!data?.gate_keeper) return [];
    return data.gate_keeper.map((gate) => ({
      ...gate,
      status: gate.status === 1 || String(gate.status).toLowerCase() === "active" || String(gate.status).toLowerCase() === "true" 
        ? "Active" 
        : "Inactive",
    }));
  }, [data]);

  // تعريف الأعمدة الخاصة بالجدول
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
    { 
      label: "Status", 
      key: "status",
      // رندر مخصص لعرض الـ status كـ Badge شيك بدل الـ Switch
      render: (row) => {
        const isActive = row.status === "Active";
        return (
          <span className={`inline-flex items-center !px-2.5 !py-1 rounded-full text-xs font-medium ${
            isActive 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            <span className={`w-1.5 h-1.5 !mr-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
            {row.status}
          </span>
        );
      }
    },
  ];

  const handleEdit = (row) => {
    console.log("Edit gate keeper:", row);
  };

  const handleDelete = (row) => {
    console.log("Delete gate keeper:", row);
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
        showAddButton={false}
        showActions={true}
        showEditButton={true}
        showDeleteButton={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}