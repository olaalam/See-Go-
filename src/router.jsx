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
import SinglePageV from "./Pages/Villages/SinglePageV";
import VAdminAdd from "./Pages/Villages/VAdminAdd";
import Apartment from "./Pages/Apartment/Apartment";
import ApartmentAdd from "./Pages/Apartment/ApartmentAdd";
import Users from "./Pages/Users/Users";
import UsersAdd from "./Pages/Users/UsersAdd";
import ProtectedRoute from "./Auth/ProtectedRoute";
import AuthLayout from "./Layout/AuthLayout";
import Services from "./Pages/ServiceTypes/Services";
import ServicesAdd from "./Pages/ServiceTypes/ServicesAdd";
import Providers from "./Pages/Providers/Providers";
import ProvidersAdd from "./Pages/Providers/ProvidersAdd";
import SinglePageP from "./Pages/Providers/SinglePageP";
import PAdminAdd from "./Pages/Providers/PAdminAdd";
import Subscription from "./Pages/Packages/Packages";
import SubscriptionAdd from "./Pages/Packages/PackagesAdd";
import Subscriper from "./Pages/Subscriper/Subscriper";
import SubscriperAdd from "./Pages/Subscriper/SubscriperAdd";
import Payments from "./Pages/Payments/Payments";
import PaymentMethod from "./Pages/Payment-methods/PaymentMethod";
import PaymentMethodAdd from "./Pages/Payment-methods/PaymentMethodAdd";
import Admin from "./Pages/Admin/Admin";
import AdminAdd from "./Pages/Admin/AdminAdd";
import Invoice from "./Pages/Invoice/Invoice";
import InvoiceEdit from "./Pages/Invoice/InvoiceEdit";

const router = createBrowserRouter([
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
          {
      path: "single-page-v/:id",
      element: <SinglePageV />,
    },
        { path: "single-page-v/:id/add", element: <VAdminAdd /> },

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
        path: "services",
        children: [
          { index: true, element: <Services /> },
          { path: "add", element: <ServicesAdd /> },
        ],
      },
      {
        path: "providers",
        children: [
          { index: true, element: <Providers /> },
          { path: "add", element: <ProvidersAdd /> },
                    {
      path: "single-page-p/:id",
      element: <SinglePageP />,
    },
        { path: "single-page-p/:id/add", element: <PAdminAdd /> },
        ],
      },
      {
        path: "packages",
        children: [
          { index: true, element: <Subscription /> },
          { path: "add", element: <SubscriptionAdd /> },
        ],
      },
      {
        path: "subscribers",
        children: [
          { index: true, element: <Subscriper /> },
          { path: "add", element: <SubscriperAdd /> },
        ],
      },
      {
        path: "payments",
        children: [{ index: true, element: <Payments /> }],
      },
      {
        path: "payment-methods",
        children: [
          { index: true, element: <PaymentMethod /> },
          { path: "add", element: <PaymentMethodAdd /> },
        ],
      },
      {
        path: "admin",
        children: [
          { index: true, element: <Admin /> },
          { path: "add", element: <AdminAdd /> },
        ],
      },
            {
        path: "invoice",
        children: [
          { index: true, element: <Invoice /> },
          { path: "edit", element: <InvoiceEdit /> },
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
