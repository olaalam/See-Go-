import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const HelpGroupsPage = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");

  const [helpGroups, setHelpGroups] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [permissions, setPermissions] = useState([]);

  const [addForm, setAddForm] = useState({
    nameEn: "",
    nameAr: "",
    status: true,
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // ======= Permissions =======
  const getUserPermissions = () => {
    try {
      const perms = localStorage.getItem("userPermission");
      const parsed = perms ? JSON.parse(perms) : [];
      return parsed.map((p) => `${p.module}:${p.action}`);
    } catch {
      return [];
    }
  };

  const hasPermission = (action) => {
    return (
      permissions.includes(`Admin Role:${action}`) ||
      permissions.includes(`Admin Role:all`)
    );
  };

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  // ======= Fetch =======
  const fetchHelpGroups = async () => {
    dispatch(showLoader());
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/help_group", {
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      const currentLang = localStorage.getItem("lang") || "en";

      const formatted = (result.help_groups || []).map((group) => {
        const nameEn = group.name?.en || group.name || "—";
        const nameAr = group.name?.ar || "—";
        return {
          id: group.id,
          nameEn,
          nameAr,
          name: nameEn,
          status: group.status === 1 ? "Active" : "Inactive",
          _raw: group,
        };
      });

      setHelpGroups(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch help groups!");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchHelpGroups();
  }, []);

  // ======= Add =======
  const handleAddSubmit = async () => {
    if (!addForm.nameEn.trim()) {
      toast.error("English name is required!");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(
        "https://bcknd.sea-go.org/admin/help_group/add",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: { en: addForm.nameEn, ar: addForm.nameAr },
            status: addForm.status,
          }),
        }
      );
      if (res.ok) {
        toast.success("Help group added successfully!");
        setIsAddOpen(false);
        setAddForm({ nameEn: "", nameAr: "", status: true });
        await fetchHelpGroups();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to add help group!");
      }
    } catch {
      toast.error("Error occurred while adding help group!");
    } finally {
      setIsSaving(false);
    }
  };

  // ======= Edit =======
  const handleEdit = (row) => {
    setSelectedRow({ ...row });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;
    setIsSaving(true);
    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/help_group/item/${selectedRow.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: { en: selectedRow.nameEn, ar: selectedRow.nameAr },
            status: selectedRow.status === "Active",
          }),
        }
      );
      if (res.ok) {
        toast.success("Help group updated successfully!");
        setIsEditOpen(false);
        setSelectedRow(null);
        await fetchHelpGroups();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update help group!");
      }
    } catch {
      toast.error("Error occurred while updating help group!");
    } finally {
      setIsSaving(false);
    }
  };

  // ======= Delete =======
  const handleDelete = (row) => {
    setSelectedRow(row);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/help_group/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        toast.success("Help group deleted successfully!");
        setHelpGroups((prev) => prev.filter((g) => g.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to delete help group!");
      }
    } catch {
      toast.error("Error occurred while deleting help group!");
    } finally {
      setIsDeleting(false);
    }
  };

  // ======= Toggle Status =======
  const handleToggleStatus = async (row, newStatus) => {
    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/help_group/status/${row.id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        toast.success("Status updated successfully!");
        setHelpGroups((prev) =>
          prev.map((g) =>
            g.id === row.id
              ? { ...g, status: newStatus === 1 ? "Active" : "Inactive" }
              : g
          )
        );
      } else {
        toast.error("Failed to update status!");
      }
    } catch {
      toast.error("Error updating status!");
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({ ...prev, [key]: value }));
  };

  // ======= Table Columns =======
  const columns = [
    { key: "nameEn", label: "Name (EN)" },
    { key: "nameAr", label: "Name (AR)" },
    { key: "status", label: "Status" },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="!p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={helpGroups}
        columns={columns}
        showAddButton={true}
        onAddClick={() => {
          setAddForm({ nameEn: "", nameAr: "", status: true });
          setIsAddOpen(true);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        searchKeys={["nameEn", "nameAr"]}
        filterKey={["status"]}
        filterOptions={filterOptions}
      />

      {/* ===== Add Dialog ===== */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-white !p-6 rounded-lg max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">
              Add Help Group
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 !py-3">
            <div>
              <Label className="text-gray-500 !mb-1 block">Name (English)</Label>
              <Input
                value={addForm.nameEn}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, nameEn: e.target.value }))
                }
                placeholder="Group name in English"
                className="!p-4 text-bg-primary"
              />
            </div>
            <div>
              <Label className="text-gray-500 !mb-1 block">Name (Arabic)</Label>
              <Input
                dir="rtl"
                value={addForm.nameAr}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, nameAr: e.target.value }))
                }
                placeholder="اسم المجموعة بالعربي"
                className="!p-4 text-bg-primary"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={addForm.status}
                onCheckedChange={(val) =>
                  setAddForm((prev) => ({ ...prev, status: val }))
                }
                id="add-status"
              />
              <Label htmlFor="add-status" className="text-gray-500">
                {addForm.status ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-3 !mt-2">
            <button
              onClick={() => setIsAddOpen(false)}
              className="border border-bg-primary text-bg-primary !px-5 !py-2 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={isSaving}
              className="bg-bg-primary text-white !px-5 !py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Dialog ===== */}
      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            isSaving={isSaving}
            onChange={onChange}
          >
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-gray-500 !mb-1 block">Name (English)</Label>
                <Input
                  value={selectedRow?.nameEn || ""}
                  onChange={(e) => onChange("nameEn", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                />
              </div>
              <div>
                <Label className="text-gray-500 !mb-1 block">Name (Arabic)</Label>
                <Input
                  dir="rtl"
                  value={selectedRow?.nameAr || ""}
                  onChange={(e) => onChange("nameAr", e.target.value)}
                  className="!my-2 text-bg-primary !p-4"
                  placeholder="اسم المجموعة بالعربي"
                />
              </div>
            </div>
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            isDeleting={isDeleting}
            name={selectedRow?.nameEn || selectedRow?.nameAr}
          />
        </>
      )}
    </div>
  );
};

export default HelpGroupsPage;