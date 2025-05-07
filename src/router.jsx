import { createBrowserRouter } from "react-router-dom";
import Home from "./Pages/Home";
import MainLayout from "./Layout/MainLayout";
import Zones from "./Pages/Zones/Zones";
import { SidebarProvider } from "./components/ui/sidebar";
import ZoneAdd from "./Pages/Zones/ZoneAdd";
import ProtAuth from "./Auth/ProtAuth";
import Login from "./components/Login/Login";
import NotFound from "./Pages/NotFound";
import Villages from "./Pages/Villages/Villages";
import VillageAdd from "./Pages/Villages/VillageAdd";
import Apartment from "./Pages/Apartment/Apartment";
import ApartmentAdd from "./Pages/Apartment/ApartmentAdd";
import Users from "./Pages/Users/Users";
import UsersAdd from "./Pages/Users/UsersAdd";
import ProtectedRoute from "./Auth/ProtectedRoute";
import AuthLayout from "./Layout/AuthLayout";

const router = createBrowserRouter([
  // ✅ صفحات تسجيل الدخول و auth layout
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <ProtAuth>
            <Login />
          </ProtAuth>
        ),
      },
    ],
  },

  // ✅ الصفحات المحمية داخل MainLayout
  {
    element: (
      <SidebarProvider>
        <MainLayout />
      </SidebarProvider>
    ),
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "zones",
        children: [
          { index: true, element: <Zones /> },
          { path: "add", element: <ZoneAdd /> },
        ],
      },
      {
        path: "villages",
        children: [
          { index: true, element: <Villages /> },
          { path: "add", element: <VillageAdd /> },
        ],
      },
      {
        path: "apartments",
        children: [
          { index: true, element: <Apartment /> },
          { path: "add", element: <ApartmentAdd /> },
        ],
      },
      {
        path: "users",
        children: [
          { index: true, element: <Users /> },
          { path: "add", element: <UsersAdd /> },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
