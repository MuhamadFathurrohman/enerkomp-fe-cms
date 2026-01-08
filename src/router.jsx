// router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./views/Auth/Login";
import ForgotPassword from "./views/Auth/ForgotPassword";
import ResetPassword from "./views/Auth/ResetPassword";
import Unauthorized from "./views/Unauthorized";
import NotFound from "./views/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Home from "./views/Home";
import Layout from "./components/Layout";
import Users from "./views/Users";
import Roles from "./views/Roles";
import Clients from "./views/Clients";
import Analytics from "./views/Analytics";
import AuditLog from "./views/AuditLog";
import Settings from "./views/Settings";
import Blogs from "./views/Content/Blogs";
import Gallery from "./views/Content/Gallery";
import Categories from "./views/Product/Categories";
import Brands from "./views/Product/Brands";
import Items from "./views/Product/Items";
import Catalogs from "./views/Catalogs";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/home" replace />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "users",
        element: (
          <RoleProtectedRoute requiredPermission="user">
            <Users />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <RoleProtectedRoute requiredPermission="role">
            <Roles />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <RoleProtectedRoute requiredPermission="client">
            <Clients />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "catalog",
        element: (
          <RoleProtectedRoute requiredPermission="catalog">
            <Catalogs />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "content",
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/content/gallery" replace />,
          },
          {
            path: "gallery",
            element: <Gallery />,
          },
          {
            path: "blogs",
            element: (
              <RoleProtectedRoute requiredPermission="blog">
                <Blogs />
              </RoleProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "products",
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/products/categories" replace />,
          },
          {
            path: "categories",
            element: (
              <RoleProtectedRoute requiredPermission="category">
                <Categories />
              </RoleProtectedRoute>
            ),
          },
          {
            path: "brands",
            element: (
              <RoleProtectedRoute requiredPermission="brand">
                <Brands />
              </RoleProtectedRoute>
            ),
          },
          {
            path: "items",
            element: (
              <RoleProtectedRoute requiredPermission="product">
                <Items />
              </RoleProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "auditlog",
        element: (
          <RoleProtectedRoute requiredPermission="audit_log">
            <AuditLog />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleProtectedRoute requiredPermission="settings">
            <Settings />
          </RoleProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  // UBAH BAGIAN INI - dari Navigate ke NotFound
  {
    path: "*",
    element: <NotFound />, // Ganti dari <Navigate to="/unauthorized" replace />
  },
]);

export default router;
