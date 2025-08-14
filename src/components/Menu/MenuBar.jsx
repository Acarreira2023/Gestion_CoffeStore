// src/components/Menu/MenuBar.jsx

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useIdioma } from "../../context/IdiomaContext";
import { exportIngresos, exportEgresos } from "../../services/exportService";
import styles from "./MenuBar.module.css";

export default function MenuBar() {
  const { logout } = useAuth();
  const { t }      = useIdioma();
  const nav        = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  const links = [
    { to: "/graficos1",     text: t("Resumen Finanzas") },
    { to: "/ingreso",       text: t("ingreso") },
    { to: "/egreso",        text: t("egreso") },
    { to: "/ingresar",      text: t("ingresar") },
    { to: "/presupuestos",  text: t("presupuestos") },
    { to: "/resumen-presupuestos", text: t("resumen_presupuestos") },
    { to: "/exportar",     text: t("exportar") },
    { to: "/configuracion", text: t("configuracion") }
  ];

  return (
    <>
      {/* BARRA DE ESCRITORIO */}
      <nav className={`navbar navbar-light ${styles.menu}`}>
        <div className="container-fluid d-flex align-items-center">
          {/* Menú desktop */}
          <ul className={`${styles.list} d-none d-md-flex flex-grow-1`}>
            {links.map(l => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? styles.active : ""
                  }
                >
                  {l.text}
                </NavLink>
              </li>
            ))}
            <li className={styles.logout}>
              <button onClick={handleLogout}>
                {t("cerrar_sesion")}
              </button>
            </li>
          </ul>

          {/* HAMBURGER TOGGLER / MÓVIL */}
          <button
            className="navbar-toggler d-md-none"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasMenu"
            aria-controls="offcanvasMenu"
            aria-label={t("Abrir menú")}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>

      {/* OFFCANVAS / MÓVIL VERTICAL */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="offcanvasMenu"
        aria-labelledby="offcanvasMenuLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasMenuLabel">
            {t("Menú")}
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label={t("Cerrar")}
          />
        </div>
        <div className="offcanvas-body">
          <ul className={`${styles.list} flex-column align-items-start`}>
            {links.map(l => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? styles.active : ""
                  }
                  data-bs-dismiss="offcanvas"
                >
                  {l.text}
                </NavLink>
              </li>
            ))}
            {/* logout alineado a la izquierda en offcanvas */}
            <li className={`${styles.logout} ${styles.offLogout}`}>
              <button onClick={handleLogout}>
                {t("cerrar_sesion")}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}