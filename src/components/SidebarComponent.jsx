import { useLocation } from "react-router-dom";
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
  { label: "Home", to: "/", icon: <Home size={20} /> },
    {
    label: "Businesses",
    icon: <Building2 size={20} />,
    children: [
      {
        label: "Villages",
        to: "/villages",
        icon: <Building2 size={20} />,
      },
      {
        label: "Service Providers",
        to: "/providers",
        icon: <Users size={20} />,
      },
      {
        label: "Maintenance Provider",
        to: "/maintenance-provider",
        icon: <Wrench size={20} />,
      },
        {
  label: "Mall",
  to: "/mall",
  icon: <ShoppingBag size={20} />,
},
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },

    {
    label: "Users",
    icon: <User size={20} />,
    children: [
      { label: "App Users", to: "/users", icon: <User size={20} /> },
      {
        label: "Admin",
        to: "/admin",
        icon: <Shield size={20} />,
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
    {
    label: "Subscribers",
    to: "/subscribers",
    icon: <Users size={20} />,
  },

  
  {
    label: "Payments",
    to: "/payments",
    icon: <DollarSign size={20} />,
  },
    {
    label: "Data",
    icon: <Database size={20} />,
    children: [
      {
        label: "For Rent",
        to: "/for-rent",
        icon: <Building2 size={20} />,
      },
      {
        label: "For Sale",
        to: "/for-sale",
        icon: <Building2 size={20} />,
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
    {
    label: "Types",
    icon: <Grid size={20} />,
    children: [
      {
        label: "Maintenance Types",
        to: "/maintenance",
        icon: <Wrench size={20} />,
      },
      {
        label: "Service Types",
        to: "/services",
        icon: <FileText size={20} />,
      },
      {
        label: "Unit Types",
        to: "/units",
        icon: <Building size={20} />,
      },
    ],
    dropdownIcon: <ChevronDown size={20} />,
  },
  {
    label: "Settings",
    icon: <Settings size={20} />,
    children: [
      {
        label: "Packages",
        to: "/packages",
        icon: <Package size={20} />,
      },
      {
        label: "Admin Roles",
        to: "/provider-roles",
        icon: <Shield size={20} />,
      },
      {
        label: "Payment Methods",
        to: "/payment-methods",
        icon: <CreditCard size={20} />,
      },
      {
        label: "Village Roles",
        to: "/village-roles",
        icon: <Users size={20} />,
      },
        { label: "Zones", to: "/zones", icon: <Map size={20} /> },
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
        const providerOnly = user?.admin?.provider_only === 1;
        console.log("User data from localStorage:", user);

        const items = providerOnly
          ? navItems.filter((item) =>
              allowedForProviderOnly.includes(item.label)
            )
          : navItems;
        setFilteredNavItems(items);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        setFilteredNavItems(navItems);
      }
    } else {
      setFilteredNavItems(navItems);
    }
  }, []);

  const handleGroupClick = (label) => {
    setOpenGroup(openGroup === label ? null : label);
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
                              const isActive = location.pathname === childItem.to;
                              return (
                                <SidebarMenuItem key={childItem.label}>
                                  <a href={childItem.to} className="w-full">
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
                                  </a>
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
                      <a href={item.to} className="w-full">
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
                      </a>
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