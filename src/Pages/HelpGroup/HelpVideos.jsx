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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HelpVideosPage = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const token = localStorage.getItem("token");

  const [helpVideos, setHelpVideos] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialAddForm = {
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    help_group_id: "",
    arVideoFile: null,
    enVideoFile: null,
    status: true,
  };
  const [addForm, setAddForm] = useState(initialAddForm);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ======= Fetch Groups =======
  const fetchAllGroups = async () => {
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/help_group", {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      const result = await res.json();
      const formatted = (result.help_groups || []).map((g) => ({
        id: g.id,
        name: g.name?.en || g.name || `Group #${g.id}`,
      }));
      setAllGroups(formatted);
    } catch {
      console.error("Failed to fetch help groups");
    }
  };

  // ======= Fetch Videos =======
  const fetchHelpVideos = async () => {
    dispatch(showLoader());
    try {
      const res = await fetch("https://bcknd.sea-go.org/admin/help_video", {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      const result = await res.json();

      // API returns paginated object: result.help_videos.data
      const rawVideos = Array.isArray(result.help_videos?.data)
        ? result.help_videos.data
        : Array.isArray(result.help_videos)
          ? result.help_videos
          : Array.isArray(result.data)
            ? result.data
            : [];

      const formatted = rawVideos.map((video) => ({
        id: video.id,
        nameEn: video.name?.en || "—",
        nameAr: video.name?.ar || "—",
        descriptionEn: video.description?.en || "",
        descriptionAr: video.description?.ar || "",
        help_group_id: video.help_group_id || "",
        groupName: video.group?.name?.en || video.group?.name || "—",
        arVideoLink: video.ar_video_link || "",
        enVideoLink: video.en_video_link || "",
        status: video.status === 1 ? "Active" : "Inactive",
      }));

      setHelpVideos(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch help videos!");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchAllGroups();
    fetchHelpVideos();
  }, []);

  // ======= Add =======
  const handleAddSubmit = async () => {
    if (!addForm.nameEn.trim()) {
      toast.error("English name is required!");
      return;
    }
    if (!addForm.help_group_id) {
      toast.error("Please select a group!");
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name[en]", addForm.nameEn);
      formData.append("name[ar]", addForm.nameAr);
      formData.append("description[en]", addForm.descriptionEn);
      formData.append("description[ar]", addForm.descriptionAr);
      formData.append("help_group_id", addForm.help_group_id);
      formData.append("status", addForm.status ? 1 : 0);
      if (addForm.arVideoFile) formData.append("ar_video", addForm.arVideoFile);
      if (addForm.enVideoFile) formData.append("en_video", addForm.enVideoFile);

      const res = await fetch("https://bcknd.sea-go.org/admin/help_video/add", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        toast.success("Help video added successfully!");
        setIsAddOpen(false);
        setAddForm(initialAddForm);
        await fetchHelpVideos();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to add help video!");
      }
    } catch {
      toast.error("Error occurred while adding help video!");
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
      const formData = new FormData();
      formData.append("name[en]", selectedRow.nameEn || "");
      formData.append("name[ar]", selectedRow.nameAr || "");
      formData.append("description[en]", selectedRow.descriptionEn || "");
      formData.append("description[ar]", selectedRow.descriptionAr || "");
      formData.append("help_group_id", selectedRow.help_group_id || "");
      formData.append("status", selectedRow.status === "Active" ? 1 : 0);
      if (selectedRow.arVideoFile) formData.append("ar_video", selectedRow.arVideoFile);
      if (selectedRow.enVideoFile) formData.append("en_video", selectedRow.enVideoFile);

      const res = await fetch(
        `https://bcknd.sea-go.org/admin/help_video/update/${selectedRow.id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (res.ok) {
        toast.success("Help video updated successfully!");
        setIsEditOpen(false);
        setSelectedRow(null);
        await fetchHelpVideos();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update help video!");
      }
    } catch {
      toast.error("Error occurred while updating help video!");
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
        `https://bcknd.sea-go.org/admin/help_video/delete/${selectedRow.id}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );
      if (res.ok) {
        toast.success("Help video deleted successfully!");
        setHelpVideos((prev) => prev.filter((v) => v.id !== selectedRow.id));
        setIsDeleteOpen(false);
        setSelectedRow(null);
      } else {
        toast.error("Failed to delete help video!");
      }
    } catch {
      toast.error("Error occurred while deleting help video!");
    } finally {
      setIsDeleting(false);
    }
  };

  // ======= Toggle Status =======
  const handleToggleStatus = async (row, newStatus) => {
    try {
      const res = await fetch(
        `https://bcknd.sea-go.org/admin/help_video/status/${row.id}?status=${newStatus}`,
        { method: "PUT", headers: getAuthHeaders() }
      );
      if (res.ok) {
        toast.success("Status updated!");
        setHelpVideos((prev) =>
          prev.map((v) =>
            v.id === row.id
              ? { ...v, status: newStatus === 1 ? "Active" : "Inactive" }
              : v
          )
        );
      } else {
        toast.error("Failed to update status!");
      }
    } catch {
      toast.error("Error updating status!");
    }
  };

  const onChange = (key, value) =>
    setSelectedRow((prev) => ({ ...prev, [key]: value }));

  // ======= Columns =======
  const columns = [
    { key: "nameEn", label: "Name (EN)" },
    { key: "nameAr", label: "Name (AR)" },
    { key: "groupName", label: "Group" },
    {
      key: "enVideoLink",
      label: "EN Video",
      render: (row) =>
        row.enVideoLink ? (
          <a
            href={row.enVideoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 underline text-xs"
          >
            View
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "arVideoLink",
      label: "AR Video",
      render: (row) =>
        row.arVideoLink ? (
          <a
            href={row.arVideoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 underline text-xs"
          >
            View
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
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

  // ======= Shared Form Fields =======
  const renderFormFields = (values, onChangeFn, isEdit = false) => (
    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto !pr-1 [scrollbar-width:none]">
      {/* Name EN */}
      <div>
        <Label className="text-gray-500 !mb-1 block">Name (English)</Label>
        <Input
          value={values.nameEn || ""}
          onChange={(e) => onChangeFn("nameEn", e.target.value)}
          placeholder="Video name in English"
          className="!p-4 text-bg-primary"
        />
      </div>

      {/* Name AR */}
      <div>
        <Label className="text-gray-500 !mb-1 block">Name (Arabic)</Label>
        <Input
          dir="rtl"
          value={values.nameAr || ""}
          onChange={(e) => onChangeFn("nameAr", e.target.value)}
          placeholder="اسم الفيديو بالعربي"
          className="!p-4 text-bg-primary"
        />
      </div>

      {/* Description EN */}
      <div>
        <Label className="text-gray-500 !mb-1 block">Description (English)</Label>
        <Input
          value={values.descriptionEn || ""}
          onChange={(e) => onChangeFn("descriptionEn", e.target.value)}
          placeholder="Description in English"
          className="!p-4 text-bg-primary"
        />
      </div>

      {/* Description AR */}
      <div>
        <Label className="text-gray-500 !mb-1 block">Description (Arabic)</Label>
        <Input
          dir="rtl"
          value={values.descriptionAr || ""}
          onChange={(e) => onChangeFn("descriptionAr", e.target.value)}
          placeholder="الوصف بالعربي"
          className="!p-4 text-bg-primary"
        />
      </div>

      {/* Group Select */}
      <div>
        <Label className="text-gray-500 !mb-1 block">Group</Label>
        <Select
          value={values.help_group_id?.toString() || ""}
          onValueChange={(val) => onChangeFn("help_group_id", val)}
        >
          <SelectTrigger className="!p-4 text-bg-primary border border-gray-300 rounded-[10px]">
            <SelectValue placeholder="Select a group..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-bg-primary rounded-[10px] text-bg-primary">
            {allGroups.map((g) => (
              <SelectItem key={g.id} value={g.id.toString()}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* EN Video Upload */}
      <div>
        <Label className="text-gray-500 !mb-1 block">English Video</Label>
        {isEdit && values.enVideoLink && (
          <a
            href={values.enVideoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 text-xs underline block !mb-1"
          >
            View current EN video
          </a>
        )}
        <Input
          type="file"
          accept="video/*,image/*"
          onChange={(e) => onChangeFn("enVideoFile", e.target.files[0] || null)}
          className="!p-2 text-bg-primary border border-gray-300 rounded-[10px]"
        />
      </div>

      {/* AR Video Upload */}
      <div>
        <Label className="text-gray-500 !mb-1 block">Arabic Video</Label>
        {isEdit && values.arVideoLink && (
          <a
            href={values.arVideoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 text-xs underline block !mb-1"
          >
            View current AR video
          </a>
        )}
        <Input
          type="file"
          accept="video/*,image/*"
          onChange={(e) => onChangeFn("arVideoFile", e.target.files[0] || null)}
          className="!p-2 text-bg-primary border border-gray-300 rounded-[10px]"
        />
      </div>

      {/* Status (only in Add) */}
      {!isEdit && (
        <div className="flex items-center gap-3">
          <Switch
            checked={values.status}
            onCheckedChange={(val) => onChangeFn("status", val)}
            id="add-video-status"
          />
          <Label htmlFor="add-video-status" className="text-gray-500">
            {values.status ? "Active" : "Inactive"}
          </Label>
        </div>
      )}
    </div>
  );

  return (
    <div className="!p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={helpVideos}
        columns={columns}
        showAddButton={true}
        onAddClick={() => {
          setAddForm(initialAddForm);
          setIsAddOpen(true);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showEditButton={true}
        showDeleteButton={true}
        searchKeys={["nameEn", "nameAr", "groupName"]}
        filterKey={["status"]}
        filterOptions={filterOptions}
      />

      {/* ===== Add Dialog ===== */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-white !p-6 rounded-lg max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">
              Add Help Video
            </DialogTitle>
          </DialogHeader>
          <div className="!py-2">
            {renderFormFields(
              addForm,
              (key, val) => setAddForm((prev) => ({ ...prev, [key]: val })),
              false
            )}
          </div>
          <div className="flex justify-end gap-3 !mt-3">
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

      {/* ===== Edit & Delete ===== */}
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
            {renderFormFields(selectedRow, onChange, true)}
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

export default HelpVideosPage;
