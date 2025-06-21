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
import Units from "./Pages/Units/Units";
import UnitsAdd from "./Pages/Units/UnitsAdd";
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
import PAdminRole from "./Pages/Providers/PAdminRole";
import PAdminRoleAdd from "./Pages/Providers/PAdminRoleAdd";
import Subscription from "./Pages/Packages/Packages";
import SubscriptionAdd from "./Pages/Packages/PackagesAdd";
import Subscriper from "./Pages/Subscriper/Subscriper";
import SubscriperAdd from "./Pages/Subscriper/SubscriperAdd";
import Payments from "./Pages/Payments/Payments";
import PaymentMethod from "./Pages/Payment-methods/PaymentMethod";
import PaymentMethodAdd from "./Pages/Payment-methods/PaymentMethodAdd";
import Admin from "./Pages/Admin/Admin";
import AdminAdd from "./Pages/Admin/AdminAdd";
import Maintenance_types from "./Pages/Maintenance/Maintenance";
import Addmaintenance_type from "./Pages/Maintenance/MaintenanceAdd";
import ServiceProvider from "./Pages/MaintenanceProvider/ServiceProvider";
import ServiceProviderAdd from "./Pages/MaintenanceProvider/ServiceProviderAdd";
import VAdminRole from "./Pages/Villages/VAdminRole";
import VAdminRoleAdd from "./Pages/Villages/VAdminRoleAdd";
import SinglePageU from "./Pages/Users/SinglePageU";
import Mall from "./Pages/Mall/Mall";
import MallAdd from "./Pages/Mall/MallAdd";
import SinglePageM from "./Pages/Mall/SinglePageM";
import MAdminAdd from "./Pages/Mall/MServiceAdd";
import InvoiceCard from "./Pages/Invoice/Invoice";
import AdminRole from "./Pages/AdminRole.jsx/AdminRole";
import AdminRoleAdd from "./Pages/AdminRole.jsx/AdminRoleDialog";

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
          <ProtectedRoute permissionKey="Home">
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "zones",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Zone">
                <Zones />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Zone">
                <ZoneAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "villages",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Village">
                <Villages />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Village">
                <VillageAdd />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-v/:id",
            element: (
              <ProtectedRoute permissionKey="Village Gallery">
                <SinglePageV />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-v/:id/add",
            element: (
              <ProtectedRoute permissionKey="Village Admin">
                <VAdminAdd />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-v/:id/invoice/:invoiceId",
            element: (
              <ProtectedRoute permissionKey="VillagesInvoiceView">
                <InvoiceCard />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "village-roles",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Village Admin Role">
                <VAdminRole />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Village Admin Role">
                <VAdminRoleAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "units",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Appartment Type">
                <Units />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Appartment Type">
                <UnitsAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "users",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="User">
                <Users />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="User">
                <UsersAdd />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-u/:id",
            element: (
              <ProtectedRoute permissionKey="User">
                <SinglePageU />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "services",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Service Type">
                <Services />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Service Type">
                <ServicesAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "providers",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Provider">
                <Providers />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Provider">
                <ProvidersAdd />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-p/:id",
            element: (
              <ProtectedRoute permissionKey="Provider Gallery">
                <SinglePageP />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-p/:id/add",
            element: (
              <ProtectedRoute permissionKey="Provider Admin">
                <PAdminAdd />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-p/:id/invoice/:invoiceId",
            element: (
              <ProtectedRoute permissionKey="ProvidersInvoiceView">
                <InvoiceCard />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "provider-roles",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Provider Admin Role">
                <PAdminRole />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Provider Admin Role">
                <PAdminRoleAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "packages",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Subscription">
                <Subscription />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Subscription">
                <SubscriptionAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "subscribers",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="subcriber">
                <Subscriper />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="subcriber ">
                <SubscriperAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "payments",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Payment">
                <Payments />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "payment-methods",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Payment Method">
                <PaymentMethod />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Payment Method">
                <PaymentMethodAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "admin",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Admin">
                <Admin />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Admin">
                <AdminAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "maintenance",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Maintenance Type">
                <Maintenance_types />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Maintenance Type">
                <Addmaintenance_type />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "maintenance-provider",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Provider Maintenance">
                <ServiceProvider />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Provider Maintenance">
                <ServiceProviderAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "mall",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Mall">
                <Mall />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Mall">
                <MallAdd />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-m/:id",
            element: (
              <ProtectedRoute permissionKey="Mall Gallery">
                <SinglePageM />
              </ProtectedRoute>
            ),
          },
          {
            path: "single-page-m/:id/add",
            element: (
              <ProtectedRoute permissionKey="Mall Admin">
                <MAdminAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "invoice",
        children: [
          {
            path: ":invoiceId",
            element: (
              <ProtectedRoute permissionKey="Invoice">
                <InvoiceCard />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "admin-role",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute permissionKey="Admin Role">
                <AdminRole />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute permissionKey="Admin Role">
                <AdminRoleAdd />
              </ProtectedRoute>
            ),
          },
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
