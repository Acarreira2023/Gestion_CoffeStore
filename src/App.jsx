/* src/App.jsx */
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Loader from "./components/Loader/Loader";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import ProtectedLayout from "./components/ProtectedLayout/ProtectedLayout";
import { useSettings } from "./hooks/useSettings";

const Login               = lazy(() => import("./pages/Login/Login"));
const Ingresar            = lazy(() => import("./pages/Ingresar/Ingresar"));
const Ingreso               = lazy(() => import("./pages/Datos/Ingreso/Ingreso"));
const Egreso               = lazy(() => import("./pages/Datos/Egreso/Egreso"));
const Graficos_1          = lazy(() => import("./pages/Graficos1/Graficos1"));
const  ExportService     = lazy(() => import("./pages/exportService/exportService"));
const Presupuestos       = lazy(() => import("./pages/Presupuestos/Presupuestos"));
const ResumenPresupuestos = lazy(() => import("./pages/ResumenPresupuestos/ResumenPresupuestos"));
const Configuracion       = lazy(() => import("./pages/Configuracion/Configuracion"));
const CambiarContraseña   = lazy(() => import("./pages/CambiarContraseña/CambiarContraseña"));
const CerrarSesion        = lazy(() => import("./pages/CerrarSesion/CerrarSesion"));

export default function App() {
  useSettings();

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <ProtectedLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="graficos1" replace />} />
          <Route path="ingresar"       element={<Ingresar />} />
          <Route path="ingreso"          element={<Ingreso />} />
          <Route path="egreso"          element={<Egreso />} />
          <Route path="graficos1"      element={<Graficos_1 />} />
          <Route path="exportar"       element={<ExportService />} />
          <Route path="presupuestos"   element={<Presupuestos />} />
          <Route path="resumen-presupuestos" element={<ResumenPresupuestos />} />
          <Route path="configuracion"  element={<Configuracion />} />
          <Route path="cambiar-contrasena" element={<CambiarContraseña />} />
          <Route path="logout"         element={<CerrarSesion />} />
        </Route>

        <Route path="*" element={<Navigate to="/graficos1" replace />} />
      </Routes>
    </Suspense>
  );
}