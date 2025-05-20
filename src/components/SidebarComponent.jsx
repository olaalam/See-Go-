import { useLocation } from "react-router-dom";
import {
  Home,
  Map,
  Building2,
  Building,
  User,
  Settings,
  CreditCard,
  DollarSign,
  Shield,
  Wrench,
  Users,
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

const navItems = [
  { label: "Home", to: "/", icon: <Home size={20} /> },
  { label: "Zones", to: "/zones", icon: <Map size={20} /> },
  { label: "Villages", to: "/villages", icon: <Building2 size={20} /> },
  { label: "Apartment Types", to: "/apartments", icon: <Building size={20} /> },
  { label: "Users", to: "/users", icon: <User size={20} /> },
  { label: "Service Types", to: "/services", icon: <Settings size={20} /> },
  { label: "Providers", to: "/providers", icon: <Users size={20} /> },
  {
    label: "Packages",
    to: "/packages",
    icon: <CreditCard size={20} />,
  },
  { label: "Subscribers", to: "/subscribers", icon: <Users size={20} /> },
  { label: "Payments", to: "/payments", icon: <DollarSign size={20} /> },
  {
    label: "Payment Methods",
    to: "/payment-methods",
    icon: <CreditCard size={20} />,
  },
  { label: "For Rent", to: "/for-rent", icon: <Building2 size={20} /> },
  { label: "For Sale", to: "/for-sale", icon: <Building2 size={20} /> },
  { label: "Admin", to: "/admin", icon: <Shield size={20} /> },
  //{ label: "Admin Role", to: "/admin-role", icon: <UserCog size={20} /> },
 // { label: "Gallery", to: "/gallery", icon: <LayoutGrid size={20} /> },
  {
    label: "Maintenance Types",
    to: "/maintenance",
    icon: <Wrench size={20} />,
  },
  {
    label: "Service Provider",
    to: "/service-provider",
    icon: <Users size={20} />,
  },

  // { label: "Invoice Village", to: "/invoice", icon: <FileText size={20} /> },
];

export function AppSidebar() {
  const location = useLocation();
  const isSidebarOpen = true;

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
          <SidebarGroupLabel className="text-white text-3xl font-semibold flex flex-col justify-center items-center text-center  !mb-3">
            SEA GO
            <hr className="w-1/2 mx-auto border-white !mt-3 !mb-6" />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="list-none p-0 bg-teal-600 flex flex-col gap-3">
              {navItems.map((item) => {
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
