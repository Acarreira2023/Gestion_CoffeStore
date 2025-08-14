// src/pages/ResumenPresupuestos/ResumenPresupuestos.jsx

import React, { useMemo } from "react";
import { useIdioma } from "../../context/IdiomaContext";
import { usePresupuestosRealtime } from "../../hooks/usePresupuestosRealtime";
import PieChartComponent from "../../components/charts/PieChart";
import { FaFileInvoice, FaCheckCircle, FaPercentage, FaTimesCircle } from "react-icons/fa";
import styles from "./ResumenPresupuestos.module.css";

export default function ResumenPresupuestos() {
  const { t } = useIdioma();
  const { presupuestos, loading } = usePresupuestosRealtime();

  const metricas = useMemo(() => {
    const total = presupuestos.length;
    const vendidos = presupuestos.filter(p => p.estado === "VENDIDO").length;
    const pendientes = presupuestos.filter(p => p.estado === "PENDIENTE").length;
    const cancelados = presupuestos.filter(p => p.estado === "CANCELADO").length;
    
    const montoTotal = presupuestos.reduce((sum, p) => sum + (p.total || 0), 0);
    const montoVendido = presupuestos
      .filter(p => p.estado === "VENDIDO")
      .reduce((sum, p) => sum + (p.total || 0), 0);
    
    const tasaConversion = total > 0 ? (vendidos / total) * 100 : 0;

    return {
      total,
      vendidos,
      pendientes,
      cancelados,
      montoTotal,
      montoVendido,
      tasaConversion
    };
  }, [presupuestos]);

  const datosEstado = useMemo(() => [
    { name: t("pendiente"), value: metricas.pendientes },
    { name: t("vendido"), value: metricas.vendidos },
    { name: t("cancelado"), value: metricas.cancelados }
  ].filter(item => item.value > 0), [metricas, t]);

  const datosItems = useMemo(() => {
    const itemsCount = {};
    presupuestos.forEach(p => {
      const item = p.item || "OTROS";
      itemsCount[item] = (itemsCount[item] || 0) + 1;
    });
    
    return Object.entries(itemsCount).map(([name, value]) => ({
      name: t(name.toLowerCase()),
      value
    }));
  }, [presupuestos, t]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(value);

  if (loading) {
    return <p className={styles.loading}>{t("cargando")}…</p>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("resumen_presupuestos")}</h2>

      {/* Tarjetas de métricas */}
      <div className={styles.metricas}>
        <div className={styles.metrica}>
          <div className={styles.metricaIcon}>
            <FaFileInvoice />
          </div>
          <div className={styles.metricaContent}>
            <h3>{t("total_presupuestos")}</h3>
            <p className={styles.metricaValue}>{metricas.total}</p>
            <span className={styles.metricaSubtitle}>
              {formatCurrency(metricas.montoTotal)}
            </span>
          </div>
        </div>

        <div className={styles.metrica}>
          <div className={styles.metricaIcon}>
            <FaCheckCircle />
          </div>
          <div className={styles.metricaContent}>
            <h3>{t("total_vendidos")}</h3>
            <p className={styles.metricaValue}>{metricas.vendidos}</p>
            <span className={styles.metricaSubtitle}>
              {formatCurrency(metricas.montoVendido)}
            </span>
          </div>
        </div>

        <div className={styles.metrica}>
          <div className={styles.metricaIcon}>
            <FaPercentage />
          </div>
          <div className={styles.metricaContent}>
            <h3>{t("tasa_conversion")}</h3>
            <p className={styles.metricaValue}>{metricas.tasaConversion.toFixed(1)}%</p>
            <span className={styles.metricaSubtitle}>
              {metricas.vendidos} de {metricas.total}
            </span>
          </div>
        </div>

        <div className={styles.metrica}>
          <div className={styles.metricaIcon}>
            <FaTimesCircle />
          </div>
          <div className={styles.metricaContent}>
            <h3>{t("presupuestos_pendientes")}</h3>
            <p className={styles.metricaValue}>{metricas.pendientes}</p>
            <span className={styles.metricaSubtitle}>
              En proceso
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.graficos}>
        <div className={styles.grafico}>
          <h3>Presupuestos por estado</h3>
          <PieChartComponent data={datosEstado} />
        </div>

        <div className={styles.grafico}>
          <h3>Presupuestos por item</h3>
          <PieChartComponent data={datosItems} />
        </div>
      </div>
    </div>
  );
}