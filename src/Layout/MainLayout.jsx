import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/SidebarComponent";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { useSelector } from "react-redux";

export default function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isLoading = useSelector((state) => state.loader.isLoading);

  return (
    <SidebarProvider>
      {!isLoginPage && <AppSidebar />}

      <main className="w-full">
        {!isLoginPage && <SidebarTrigger />}
        
        <div className="flex flex-col min-h-screen md:!ps-2 sm:!p-0 md:max-w-auto sm:w-full">
          {!isLoginPage && <Navbar className="!p-2" />}

          <div className="relative flex-1 p-4"> 
          {isLoading && <Loading />}            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
