import React from "react";
import { useIdioma } from "../../context/IdiomaContext";
import { exportIngresos, exportEgresos, exportPresupuestos } from "../../services/exportService";
import styles from "../exportService/exportService.module.css";

export default function ExportService() {
  const { t } = useIdioma();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t("exportar_datos")}</h1>
      <div className={styles.cards}>
        <div className={styles.card} onClick={exportIngresos}>
          <span className={styles.icon}>📈</span>
          <h3>{t("datos_ingresos")}</h3>
        </div>
        <div className={styles.card} onClick={exportEgresos}>
          <span className={styles.icon}>📉</span>
          <h3>{t("datos_egresos")}</h3>
        </div>
        <div className={styles.card} onClick={exportPresupuestos}>
          <span className={styles.icon}>📋</span>
          <h3>{t("presupuestos")}</h3>
        </div>
      </div>
    </div>
  );
}