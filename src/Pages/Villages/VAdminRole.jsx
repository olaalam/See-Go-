import { useEffect, useState } from "react";
import DataTable from "@/components/DataTableLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditDialog from "@/components/EditDialog";
import DeleteDialog from "@/components/DeleteDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@/Store/LoaderSpinner";
import FullPageLoader from "@/components/Loading";
import { Input } from "@/components/ui/input";

// Import the necessary Select components
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const Village_roless = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const [village_roless, setvillage_roless] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewRolesOpen, setIsViewRolesOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allAvailableRoles, setAllAvailableRoles] = useState([]); // New state for all selectable roles
  const [selectedEditRoles, setSelectedEditRoles] = useState([]); // State for roles in edit dialog

  // Get parameters from the URL
  // Assuming your route is 'single-page-v/:id/admin/:adminId'
  // If your route is 'single-page-v/:id/admin/:id', you'll need to rename one of the IDs in the router config
  // For clarity, I'm assuming the second :id in the route is meant to be an admin ID.

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchvillage_roless = async () => {
    dispatch(showLoader());
    try {
      const response = await fetch("https://bcknd.sea-go.org/admin/village_roles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const currentLang = localStorage.getItem("lang") || "en";

      // Store the top-level 'roles' array for the dropdown
      setAllAvailableRoles(Array.isArray(result.roles) ? result.roles : []);

      const formatted = result.admin_position.map((adminPosition) => {
        const translations = Array.isArray(adminPosition.translations)
          ? adminPosition.translations.reduce((acc, t) => {
              if (!acc[t.locale]) acc[t.locale] = {};
              acc[t.locale][t.key] = t.value;
              return acc;
            }, {})
          : {};

        const name = translations[currentLang]?.name || adminPosition.name || "—";

        let roleToDisplay = "";
        if (Array.isArray(adminPosition.roles) && adminPosition.roles.length > 0) {
          roleToDisplay = adminPosition.roles.map((roleObj) => roleObj.module).join(", ");
        } else {
          roleToDisplay = adminPosition.name;
        }

        return {
          id: adminPosition.id,
          name: name,
          role: roleToDisplay, // Display string for the DataTable
          status: adminPosition.status === 1 ? "active" : "inactive",
          admin_roles_array: adminPosition.roles, // Store the full array of role objects for the modal and edit
        };
      });
      setvillage_roless(formatted);
    } catch (error) {
      console.error("Error fetching village_roless:", error);
      toast.error("Failed to load village_roless data");
    } finally {
      dispatch(hideLoader());
    }
  };

  useEffect(() => {
    fetchvillage_roless();
  }, []);

  const handleEdit = (village_roles) => {
    setSelectedRow(village_roles);
    // Initialize selectedEditRoles with the 'module' strings of the currently assigned roles
    setSelectedEditRoles(village_roles.admin_roles_array?.map(r => r.module) || []);
    setIsEditOpen(true);
  };

  const handleDelete = (village_roles) => {
    setSelectedRow(village_roles);
    setIsDeleteOpen(true);
  };

  const handleViewRoles = (village_roles) => {
    setSelectedRoles(village_roles.admin_roles_array || []); // Use admin_roles_array for the modal
    setIsViewRolesOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    const { id, name, status } = selectedRow;
    const formData = new FormData();

    formData.append("name", name);
    formData.append("status", status === "active" ? 1 : 0);

    // Append all selected roles (modules) to the FormData
    selectedEditRoles.forEach((moduleName) => {
      formData.append("roles[]", moduleName);
    });

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_roles/update/${id}`,
        {
          method: "POST", // Or PUT/PATCH if your API uses that
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Village role updated successfully!");
        await fetchvillage_roless(); // Re-fetch data to reflect changes
        setIsEditOpen(false);
        setSelectedRow(null);
        setSelectedEditRoles([]); // Reset selected roles
      } else {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        toast.error(errorData.message || "Failed to update village role!");
      }
    } catch (error) {
      console.error("Error updating village_roles:", error);
      toast.error("Error occurred while updating village role!");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_roles/delete/${selectedRow.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Village role deleted successfully!");
        setvillage_roless(village_roless.filter((village_roles) => village_roles.id !== selectedRow.id));
        setIsDeleteOpen(false);
      } else {
        toast.error("Failed to delete village role!");
      }
    } catch (error) {
      console.error("Error deleting village_roles:", error);
      toast.error("Error occurred while deleting village role!");
    }
  };

  const handleToggleStatus = async (row, newStatus) => {
    const { id } = row;

    try {
      const response = await fetch(
        `https://bcknd.sea-go.org/admin/village_roles/status/${id}?status=${newStatus}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast.success("Village role status updated successfully!");
        setvillage_roless((prevvillage_roless) =>
          prevvillage_roless.map((village_roles) =>
            village_roles.id === id
              ? { ...village_roles, status: newStatus === 1 ? "active" : "inactive" }
              : village_roles
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to update village_roles status:", errorData);
        toast.error("Failed to update village role status!");
      }
    } catch (error) {
      console.error("Error updating village_roles status:", error);
      toast.error("Error occurred while updating village role status!");
    }
  };

  const onChange = (key, value) => {
    setSelectedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handler for when a role is selected/deselected in the dropdown
  const handleEditRoleChange = (selectedModule) => {
    setSelectedEditRoles((prevSelectedRoles) => {
      if (prevSelectedRoles.includes(selectedModule)) {
        // If already selected, remove it (deselect)
        return prevSelectedRoles.filter((module) => module !== selectedModule);
      } else {
        // If not selected, add it (select)
        return [...prevSelectedRoles, selectedModule];
      }
    });
  };

  const columns = [
    { key: "name", label: "Admin Name" },
    {
      key: "role",
      label: "Assigned Roles", // Changed label to be more descriptive
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="!px-3 !py-2 text-bg-primary cursor-pointer hover:bg-gray-200 transition-all"
          onClick={() => handleViewRoles(row)}
        >
          View Roles ({row.admin_roles_array?.length || 0})
        </Button>
      ),
    },
    { key: "status", label: "Status" },
  ];

  const filterOptionsForvillage_roless = [
    {
      key: "status", // This matches the filterKey
      label: "Filter by Status", // Label for the filter group in the UI
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Active", label: "Active" }, // Make sure these values match your data's status values
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];


  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}
      <ToastContainer />

      <DataTable
        data={village_roless}
        columns={columns}
        addRoute={`/village-roles/add`} // Use the dynamically constructed addRoute
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        showFilter={true}
        filterKey={["status"]}
        filterOptions={filterOptionsForvillage_roless}
        searchKeys={["name"]} 
      />

      {selectedRow && (
        <>
          <EditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSave={handleSave}
            selectedRow={selectedRow}
            columns={columns}
            onChange={onChange}
          >
            <label htmlFor="name" className="text-gray-400 !pb-3">
              Role Name
            </label>
            <Input
              id="name"
              value={selectedRow?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="!my-2 text-bg-primary !p-4"
            />

            {/* Role Selection Input */}
            <div className="w-full mt-4">
              <label htmlFor="assignedRoles" className="text-gray-400">
                Assign Modules
              </label>
              <Select
                value={selectedEditRoles.length > 0 ? selectedEditRoles[0] : ""}
                onValueChange={handleEditRoleChange} 
              >
                <SelectTrigger
                  id="assignedRoles"
                  className="!my-2 text-bg-primary w-full !p-4 border border-bg-primary rounded-[10px]"
                >
                  <SelectValue placeholder="Select modules" />
                </SelectTrigger>
                <SelectContent className="bg-white border !p-3 border-bg-primary rounded-[10px] text-bg-primary">
                  {allAvailableRoles.map((roleModule) => (
                    <SelectItem
                      key={roleModule}
                      value={roleModule}
                      className={`${selectedEditRoles.includes(roleModule) ? 'bg-gray-100 font-semibold' : ''}`}
                    >
                      {roleModule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {selectedEditRoles.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                    Currently assigned: {selectedEditRoles.join(", ")}
                </div>
               )}
               {selectedEditRoles.length === 0 && (
                <div className="mt-2 text-sm text-gray-600">
                    No modules assigned.
                </div>
               )}
            </div>
            {/* End Role Selection Input */}
          </EditDialog>

          <DeleteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDelete={handleDeleteConfirm}
            name={selectedRow.name}
          />
        </>
      )}

      {/* Roles View Modal */}
      <Dialog open={isViewRolesOpen} onOpenChange={setIsViewRolesOpen}>
        <DialogContent className="bg-white !mb-4 !p-6 rounded-lg shadow-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-bg-primary">Assigned Roles</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] md:grid-cols-2 lg:grid-cols-3 !p-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {selectedRoles.length > 0 ? (
              <ul className="space-y-2">
                {selectedRoles.map((role, index) => (
                  <li
                    key={index}
                    className="!p-2 !m-1 border rounded-md bg-gray-50 dark:bg-gray-300"
                  >
                    {role.module || "N/A"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No roles assigned to this admin position.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Village_roless;