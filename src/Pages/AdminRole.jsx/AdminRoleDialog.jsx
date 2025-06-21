import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import Loading from "@/components/Loading";

const RoleForm = ({ type = "add", initialData = null, onSuccess }) => {
  const navigate = useNavigate();

  const [roleName, setRoleName] = useState("");
  const [permissionsData, setPermissionsData] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [roleStatus, setRoleStatus] = useState(0);
  const [loading, setLoading] = useState(false);

  const areAllPermissionsSelected = Object.values(selectedPermissions).every(
    (permissions, index) =>
      permissions.length === Object.values(permissionsData)[index]?.length
  );

  const normalizeStatus = (status) => {
    if (
      status === 1 ||
      status === "1" ||
      status === true ||
      status === "true" ||
      status === "Active" ||
      status === "active"
    ) {
      return 1;
    }
    return 0;
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "https://bcknd.sea-go.org/admin/admin_role",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (res.data?.roles) {
          const permissions = res.data.roles;
          setPermissionsData(permissions);

          const initialSelected = {};
          Object.keys(permissions).forEach((category) => {
            initialSelected[category] = [];
          });

          setSelectedPermissions(initialSelected);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        toast.error("Error loading permissions data");
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (
      type === "edit" &&
      initialData &&
      Object.keys(permissionsData).length > 0
    ) {
      console.log("Initial Data for Edit:", initialData);
      setRoleName(initialData.name || "");

      const normalizedStatus = normalizeStatus(initialData.status);
      console.log(
        "Original Status:",
        initialData.status,
        "Normalized:",
        normalizedStatus
      );
      setRoleStatus(normalizedStatus);

      const transformedPermissions = {};
      Object.keys(permissionsData).forEach((category) => {
        transformedPermissions[category] = [];
      });

      if (initialData.sup_roles && Array.isArray(initialData.sup_roles)) {
        initialData.sup_roles.forEach(({ module, action }) => {
          if (
            module &&
            action &&
            transformedPermissions.hasOwnProperty(module)
          ) {
            transformedPermissions[module].push(action);
          }
        });
      }

      setSelectedPermissions(transformedPermissions);
    }
  }, [type, initialData, permissionsData]);

  const handleSelectAll = () => {
    const allSelectedPermissions = {};
    Object.keys(permissionsData).forEach((category) => {
      allSelectedPermissions[category] = [...permissionsData[category]];
    });
    setSelectedPermissions(allSelectedPermissions);
  };

  const handleDeselectAll = () => {
    const resetPermissions = {};
    Object.keys(permissionsData).forEach((category) => {
      resetPermissions[category] = [];
    });
    setSelectedPermissions(resetPermissions);
  };

  const toggleSelectAll = () => {
    const isAllSelected = Object.values(selectedPermissions).every(
      (permissions, index) =>
        permissions.length === Object.values(permissionsData)[index]?.length
    );

    if (isAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  const handleSelectAllCategory = (category) => {
    if (
      selectedPermissions[category]?.length ===
      permissionsData[category]?.length
    ) {
      setSelectedPermissions((prev) => ({ ...prev, [category]: [] }));
    } else {
      setSelectedPermissions((prev) => ({
        ...prev,
        [category]: [...permissionsData[category]],
      }));
    }
  };

  const isAllSelectedInCategory = (category) =>
    selectedPermissions[category]?.length === permissionsData[category]?.length;

  const handleTogglePermission = (category, permissionName) => {
    setSelectedPermissions((prev) => {
      const categoryPermissions = prev[category] || [];
      return {
        ...prev,
        [category]: categoryPermissions.includes(permissionName)
          ? categoryPermissions.filter((perm) => perm !== permissionName)
          : [...categoryPermissions, permissionName],
      };
    });
  };

  const handleRoleStatus = (checked) => {
    console.log("Switch toggled, new value:", checked);
    setRoleStatus(checked ? 1 : 0);
  };

  const handleReset = () => {
    setRoleName("");
    setRoleStatus(0);
    const resetPermissions = {};
    Object.keys(permissionsData).forEach((category) => {
      resetPermissions[category] = [];
    });
    setSelectedPermissions(resetPermissions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const flattenedPermissions = [];
    Object.entries(selectedPermissions).forEach(([category, permissions]) => {
      permissions.forEach((permission) => {
        flattenedPermissions.push({ category, permission });
      });
    });

    if (!roleName.trim()) return toast.error("Role name is required");
    if (flattenedPermissions.length === 0)
      return toast.error("Please select at least one permission");

    const formData = new FormData();
    formData.append("name", roleName.trim());
    formData.append("status", roleStatus);

    flattenedPermissions.forEach(({ category, permission }, index) => {
      formData.append(`roles[${index}][module]`, category);
      formData.append(`roles[${index}][action]`, permission);
    });

    console.log("Submitting with status:", roleStatus);

    try {
      setLoading(true);
      const endpoint =
        type === "edit"
          ? `https://bcknd.sea-go.org/admin/admin_role/update/${initialData?.id}`
          : "https://bcknd.sea-go.org/admin/admin_role/add";

      const res = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.data?.success) {
        toast.success(
          `Role ${type === "edit" ? "updated" : "added"} successfully`
        );
        onSuccess ? onSuccess() : navigate("/admin-role");
      } else {
        toast.error(res.data?.message || "Error from server");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(err.response?.data?.message || "Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center w-full h-56">
          <Loading />
        </div>
      ) : (
        <section className="!p-6 !mb-20 ">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="!space-y-4">
              <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-4">
                  <div className="!space-y-2 lg:col-span-2">
                    <label
                      htmlFor="role-name"
                      className="block text-lg font-medium text-bg-primary"
                    >
                      Role Name:
                    </label>
                    <Input
                      id="role-name"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="Enter Role Name"
                      className="w-full !ps-2 bg-white text-bg-primary border-teal-300
             focus:text-bg-primary focus:outline-none focus:ring-2 focus:ring-bg-primary focus:ring-offset-0"
                    />
                  </div>

                  <div className="flex items-center !pt-8 !space-x-3 lg:col-span-1">
                    <span className="text-lg font-medium text-bg-primary">
                      Active:
                    </span>
                    <Switch
                      onCheckedChange={handleRoleStatus}
                      checked={roleStatus === 1}
                      srLabel="Toggle role active status"
                      className="bg-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="!space-y-2">
                <div className="flex items-center !p-3 space-x-3 rounded-lg ">
                  <input
                    type="checkbox"
                    id="select-all"
                    onChange={toggleSelectAll}
                    checked={areAllPermissionsSelected}
                    className="w-5 h-5 text-teal-600 bg-bg-primary rounded border-gray-300 focus:ring-2 focus:ring-bg-primary"
                  />

                  <label
                    htmlFor="select-all"
                    className="text-lg !ms-2 !ps-2 font-semibold text-gray-300"
                  >
                    Select All Permissions
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {Object.keys(permissionsData).map((category) => (
                    <div
                      key={category}
                      className="!p-5 transition-shadow border border-gray-200 rounded-lg bg-teal-50 hover:shadow-md"
                    >
                      <div className="flex items-center !pb-2 !mb-4 !space-x-3 border-b border-gray-200 bg-teal-50">
                        <input
                          type="checkbox"
                          id={`select-all-${category}`}
                          onChange={() => handleSelectAllCategory(category)}
                          checked={isAllSelectedInCategory(category)}
                          className="w-5 h-5 text-teal-600 bg-bg-primary rounded border-gray-300 focus:ring-2 focus:ring-bg-primary"
                        />
                        <label
                          htmlFor={`select-all-${category}`}
                          className="text-xl font-semibold text-bg-primary capitalize"
                        >
                          {category.replace(/-/g, " ")}
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {permissionsData[category].map((permission, index) => (
                          <div
                            key={index}
                            className="flex items-center !space-x-3"
                          >
                            <input
                              type="checkbox"
                              id={`permission-${category}-${index}`}
                              checked={selectedPermissions[category]?.includes(
                                permission
                              )}
                              onChange={() =>
                                handleTogglePermission(category, permission)
                              }
                              className="w-5 h-5 text-teal-600 bg-bg-primary rounded border-gray-300 focus:ring-2 focus:ring-bg-primary"
                            />
                            <label
                              htmlFor={`permission-${category}-${index}`}
                              className="font-medium text-bg-primary"
                            >
                              {permission}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end w-full gap-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="!px-3 !py-2 text-teal-700 bg-white border-teal-300 hover:bg-teal-50 transition-all"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                rounded="rounded-full"
                type="submit"
                className="!px-3 !py-2 text-white bg-teal-600 border-teal-600 hover:bg-teal-700 transition-all"
              >
                {type === "edit" ? "Update" : "Submit"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </>
  );
};

export default RoleForm;
