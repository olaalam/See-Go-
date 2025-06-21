import { useLocation, Link } from "react-router-dom";
import {
  Home,
  Map,
  Building2,
  Building,
  User,
  Settings,
  CreditCard,
  Grid,
  FileText,
  Database,
  Package,
  ChevronDown,
  DollarSign,
  Shield,
  Wrench,
  Users,
  ShoppingBag,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useEffect, useState } from "react";

const navItems = [
  { label: "Home", to: "/", icon: <Home size={20} />, permissionKey: "Home" },
  {
    label: "Businesses",
    icon: <Building2 size={20} />,
    permissionKey: null,
    children: [
      {
        label: "Villages",
        to: "/villages",
        icon: <Building2 size={20} />,
        permissionKey: "Village",
      },
      {
        label: "Service Providers",
        to: "/providers",
        icon: <Users size={20} />,
        permissionKey: "Provider",
      },
      {
        label: "Maintenance Provider",
        to: "/maintenance-provider",
        icon: <Wrench size={20} />,
        permissionKey: "Provider Maintenance",
      },
      {
        label: "Mall",
        to: "/mall",
        icon: <ShoppingBag size={20} />,
        permissionKey: "Mall",
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
  {
    label: "Users",
    icon: <User size={20} />,
    permissionKey: null,
    children: [
      {
        label: "App Users",
        to: "/users",
        icon: <User size={20} />,
        permissionKey: "User",
      },
      {
        label: "Admin",
        to: "/admin",
        icon: <Shield size={20} />,
        permissionKey: "Admin",
      },
      {
        label: "Admin Roles",
        to: "/admin-role",
        icon: <Shield size={20} />,
        permissionKey: "Admin Role",
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
  {
    label: "Subscribers",
    to: "/subscribers",
    icon: <Users size={20} />,
    // تم تصحيح الخطأ الإملائي
    permissionKey: "subcriber", // نستخدم نفس الاسم الموجود في البيانات
  },
  {
    label: "Payments",
    to: "/payments",
    icon: <DollarSign size={20} />,
    permissionKey: "Payment",
  },
  {
    label: "Data",
    icon: <Database size={20} />,
    permissionKey: null,
    children: [
      {
        label: "For Rent",
        to: "/for-rent",
        icon: <Building2 size={20} />,
        permissionKey: "Village",
      },
      {
        label: "For Sale",
        to: "/for-sale",
        icon: <Building2 size={20} />,
        permissionKey: "Village",
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
  {
    label: "Types",
    icon: <Grid size={20} />,
    permissionKey: null,
    children: [
      {
        label: "Maintenance Types",
        to: "/maintenance",
        icon: <Wrench size={20} />,
        permissionKey: "Maintenance Type",
      },
      {
        label: "Service Types",
        to: "/services",
        icon: <FileText size={20} />,
        permissionKey: "Service Type",
      },
      {
        label: "Unit Types",
        to: "/units",
        icon: <Building size={20} />,
        permissionKey: "Appartment Type",
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
  {
    label: "Settings",
    icon: <Settings size={20} />,
    permissionKey: null,
    children: [
      {
        label: "Packages",
        to: "/packages",
        icon: <Package size={20} />,
        permissionKey: "Subscription",
      },
      {
        label: "Provider Admin Roles",
        to: "/provider-roles",
        icon: <Shield size={20} />,
        permissionKey: "Provider Admin Role",
      },
      {
        label: "Payment Methods",
        to: "/payment-methods",
        icon: <CreditCard size={20} />,
        permissionKey: "Payment Method",
      },
      {
        label: "Village Roles",
        to: "/village-roles",
        icon: <Users size={20} />,
        permissionKey: "Village Admin Role",
      },
      {
        label: "Zones",
        to: "/zones",
        icon: <Map size={20} />,
        permissionKey: "Zone",
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
];

const allowedForProviderOnly = ["Service Providers"];

export function AppSidebar() {
  const location = useLocation();
  const isSidebarOpen = true;
  const [filteredNavItems, setFilteredNavItems] = useState([]);
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        console.log("Full user data:", user);
        
        // التحقق من البيانات المتاحة
        const userRoles = user?.roles || [];
        const providerOnly = user?.admin?.provider_only === 1;
        
        console.log("User roles:", userRoles);
        console.log("Provider only?", providerOnly);

        // تحويل البيانات من array إلى object مُفهرس حسب module
        const rolesObject = convertRolesToObject(userRoles);
        console.log("Converted roles object:", rolesObject);

        let itemsToFilter = navItems;

        // فلترة العناصر للمستخدمين الذين يُسمح لهم بـ provider only
        if (providerOnly) {
          itemsToFilter = navItems.filter((item) =>
            allowedForProviderOnly.includes(item.label)
          );
          console.log("Filtered items for provider only:", itemsToFilter);
        }

        const allowedItems = filterItems(itemsToFilter, rolesObject);
        console.log("Final filtered items:", allowedItems);

        setFilteredNavItems(allowedItems);

        // افتح الجروب الذي يحتوي على المسار الحالي
        for (const item of allowedItems) {
          if (item.children) {
            if (item.children.some((child) => child.to === location.pathname)) {
              setOpenGroup(item.label);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        setFilteredNavItems([]);
      }
    } else {
      console.log("No user data found");
      setFilteredNavItems([]);
    }
  }, [location.pathname]);

  const handleGroupClick = (label) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  // تحويل البيانات من array إلى object
  const convertRolesToObject = (rolesArray) => {
    const rolesObject = {};
    
    rolesArray.forEach(role => {
      const module = role.module;
      const action = role.action;
      
      if (!rolesObject[module]) {
        rolesObject[module] = [];
      }
      
      rolesObject[module].push(action);
    });
    
    return rolesObject;
  };

  // التحقق من الصلاحيات
  const hasPermission = (roles, moduleKey, permission = "view") => {
    console.log(`Checking permission for module: ${moduleKey}, permission: ${permission}`);
    console.log("Available roles:", Object.keys(roles));
    
    if (!roles || !moduleKey) {
      console.log("No roles or moduleKey provided");
      return false;
    }
    
    const modulePermissions = roles[moduleKey];
    if (!modulePermissions) {
      console.log(`No permissions found for module: ${moduleKey}`);
      return false;
    }
    
    console.log(`Permissions for ${moduleKey}:`, modulePermissions);
    
    const hasAccess = modulePermissions.includes(permission) || modulePermissions.includes("all");
    console.log(`Access granted: ${hasAccess}`);
    
    return hasAccess;
  };

  // فلترة العناصر حسب الصلاحيات
  const filterItems = (items, roles) => {
    return items
      .map((item) => {
        if (item.children) {
          // فلتر الأطفال أولاً
          const filteredChildren = filterItems(item.children, roles);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null; // لا يظهر العنصر الأب إذا لم يكن له أطفال مسموح لهم
        } else {
          if (!item.permissionKey) {
            console.log(`Item ${item.label} has no permission key, skipping`);
            return null;
          }
          
          const hasAccess = hasPermission(roles, item.permissionKey);
          console.log(`Item ${item.label} (${item.permissionKey}): ${hasAccess ? 'ALLOWED' : 'DENIED'}`);
          
          return hasAccess ? item : null;
        }
      })
      .filter(Boolean);
  };

  return (
    <Sidebar className="bg-teal-600 !me-20 border-none sm:border-none rounded-tr-4xl rounded-br-4xl overflow-x-hidden !pb-10 !pt-10 h-full shadow-lg transition-all duration-300">
      <SidebarContent
        className="bg-teal-600 !p-6 text-white mt-10 border-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <SidebarGroup>
          <SidebarGroupLabel className="text-white text-3xl font-semibold flex flex-col justify-center items-center text-center !mb-3">
            SEA GO
            <hr className="w-1/2 mx-auto border-white !mt-3 !mb-6" />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="list-none p-0 bg-teal-600 flex flex-col gap-3">
              {filteredNavItems.map((item) => {
                if (item.children) {
                  const isGroupOpen = openGroup === item.label;
                  return (
                    <SidebarGroup key={item.label} className="!mb-3">
                      <SidebarMenuButton
                        onClick={() => handleGroupClick(item.label)}
                        className={`flex justify-between items-center gap-3 !px-4 !py-2 text-white transition-all duration-200 text-sm font-medium w-full
                                    ${isSidebarOpen ? "rounded-full" : ""}
                                    ${
                                      isGroupOpen
                                        ? "bg-white text-bg-primary shadow-md"
                                        : "hover:bg-white hover:text-bg-primary"
                                    }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-base">{item.label}</span>
                        </div>
                        {item.dropdownIcon && (
                          <span
                            className={`transition-transform duration-200 ${
                              isGroupOpen ? "rotate-180" : ""
                            }`}
                          >
                            {item.dropdownIcon}
                          </span>
                        )}
                      </SidebarMenuButton>
                      {isGroupOpen && (
                        <SidebarGroupContent className="ps-6 pt-2 pb-2">
                          <SidebarMenu className="flex flex-col gap-2">
                            {item.children.map((childItem) => {
                              const isActive =
                                location.pathname === childItem.to;
                              return (
                                <SidebarMenuItem key={childItem.label}>
                                  <Link to={childItem.to} className="w-full">
                                    <SidebarMenuButton
                                      isActive={isActive}
                                      className={`flex justify-start items-center gap-3 !px-4 !py-2 text-white transition-all duration-200 text-sm font-medium
                                                  ${
                                                    isSidebarOpen
                                                      ? "rounded-full"
                                                      : ""
                                                  }
                                                  ${
                                                    isActive
                                                      ? "bg-white text-bg-primary shadow-md"
                                                      : "hover:bg-white hover:text-bg-primary"
                                                  }`}
                                    >
                                      {childItem.icon}
                                      <span className="text-base">
                                        {childItem.label}
                                      </span>
                                    </SidebarMenuButton>
                                  </Link>
                                </SidebarMenuItem>
                              );
                            })}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      )}
                    </SidebarGroup>
                  );
                } else {
                  const isActive = location.pathname === item.to;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link to={item.to} className="w-full">
                        <SidebarMenuButton
                          isActive={isActive}
                          className={`flex justify-start items-center gap-3 !px-4 !py-2 text-white transition-all duration-200 text-sm font-medium
                                      ${isSidebarOpen ? "rounded-full" : ""}
                                      ${
                                        isActive
                                          ? "bg-white text-bg-primary shadow-md"
                                          : "hover:bg-white hover:text-bg-primary"
                                      }`}
                        >
                          {item.icon}
                          <span className="text-base">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}