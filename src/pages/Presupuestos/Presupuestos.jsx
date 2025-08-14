// src/pages/Presupuestos/Presupuestos.jsx

import React, { useState } from "react";
import { useIdioma } from "../../context/IdiomaContext";
import { usePresupuestosRealtime } from "../../hooks/usePresupuestosRealtime";
import { usePresupuestosCrud } from "../../hooks/usePresupuestosCrud";
import { formatDateTime } from "../../utils/dateUtils";
import { FaEdit, FaTrash, FaCheck, FaEye } from "react-icons/fa";
import styles from "./Presupuestos.module.css";

export default function Presupuestos() {
  const { t } = useIdioma();
  const { presupuestos, loading } = usePresupuestosRealtime();
  const { removePresupuesto, convertirAVenta } = usePresupuestosCrud();
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const presupuestosFiltrados = presupuestos.filter(p => 
    filtroEstado === "TODOS" || p.estado === filtroEstado
  );

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "PENDIENTE": return styles.pendiente;
      case "VENDIDO": return styles.vendido;
      case "CANCELADO": return styles.cancelado;
      default: return "";
    }
  };

  if (loading) {
    return <p className={styles.loading}>{t("cargando")}…</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("presupuestos")}</h2>
        
        <div className={styles.filtros}>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={styles.filtroSelect}
          >
            <option value="TODOS">{t("todos")}</option>
            <option value="PENDIENTE">{t("pendiente")}</option>
            <option value="VENDIDO">{t("vendido")}</option>
            <option value="CANCELADO">{t("cancelado")}</option>
          </select>
        </div>
      </div>

      {presupuestosFiltrados.length === 0 ? (
        <p className={styles.noData}>No hay presupuestos para mostrar</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("fecha")}</th>
                <th>{t("cliente")}</th>
                <th>{t("items")}</th>
                <th>{t("marca_modelo")}</th>
                <th>{t("cantidad")}</th>
                <th>{t("total")}</th>
                <th>{t("estado")}</th>
                <th>{t("acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {presupuestosFiltrados.map((presupuesto) => (
                <tr key={presupuesto.id}>
                  <td>{formatDateTime(presupuesto.fecha?.toDate())}</td>
                  <td>{presupuesto.cliente}</td>
                  <td>{t(presupuesto.item?.toLowerCase())}</td>
                  <td>{t(presupuesto.marcaModelo?.toLowerCase())}</td>
                  <td>{presupuesto.cantidad}</td>
                  <td>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: "USD",
                    }).format(presupuesto.total)}
                  </td>
                  <td>
                    <span className={`${styles.estado} ${getEstadoColor(presupuesto.estado)}`}>
                      {t(presupuesto.estado?.toLowerCase())}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    {presupuesto.estado === "PENDIENTE" && (
                      <button
                        className={styles.convertir}
                        onClick={() => convertirAVenta(presupuesto)}
                        title={t("convertir_a_venta")}
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button
                      className={styles.edit}
                      onClick={() => console.log("Editar", presupuesto.id)}
                      title={t("editar")}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => removePresupuesto(presupuesto.id)}
                      title={t("eliminar")}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}