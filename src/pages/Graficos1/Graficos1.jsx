import React, { useState, useMemo } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { useIdioma } from "../../context/IdiomaContext";
import { useReportData } from "../../hooks/useReportData";
import BarComparativo from "../../components/charts/BarComparativo";
import PieChartComponent from "../../components/charts/PieChart";
import styles from "./Graficos1.module.css";

// formatea a "dd-mm-aaaa" sin problemas de zona horaria
const formatDDMMYYYY = v => {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}-${m}-${y}`;
  }
  if (typeof v === "number") {
    const d = new Date(v);
    const day   = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year  = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (v instanceof Date) {
    const day   = String(v.getDate()).padStart(2, "0");
    const month = String(v.getMonth() + 1).padStart(2, "0");
    const year  = v.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return String(v);
};

export default function Graficos1() {
  const { t } = useIdioma();

  // filtro
  const [mode, setMode]     = useState("single");
  const [fecha, setFecha]   = useState("");
  const [desde, setDesde]   = useState("");
  const [hasta, setHasta]   = useState("");
  const [mes, setMes]       = useState("");
  const [anio, setAnio]     = useState("");
  const [params, setParams] = useState({});

  const {
    byDate,
    ingresosByTipo,
    egresosByTipo,
    ingresosByCategoria,
    egresosByCategoria,
    loading
  } = useReportData(params);

  // totales/métricas
  const totalI   = byDate.reduce((acc, d) => acc + d.ingresos, 0);
  const totalE   = byDate.reduce((acc, d) => acc + d.egresos, 0);
  const utilidad = totalI - totalE;
  const indice   = totalE > 0 ? utilidad / totalE : 0;
  const margen   = totalI > 0 ? (utilidad / totalI) * 100 : 0;

  // formateadores numéricos
  const fmtCurr = v =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v);
  const fmtIdx = v => v.toFixed(2);
  const fmtPct = p =>
    new Intl.NumberFormat("es-AR", {
      style: "percent",
      minimumFractionDigits: 1
    }).format(p / 100);

  // tarjetas
  const cards = useMemo(() => [
    { label: t("total_ingresos"),   value: totalI,   fmt: fmtCurr, color: "green" },
    { label: t("total_egresos"),    value: totalE,   fmt: fmtCurr, color: "red"   },
    { label: t("utilidad"),         value: utilidad, fmt: fmtCurr, color: utilidad >= 0 ? "green" : "red" },
    { label: t("indice"),           value: indice,   fmt: fmtIdx,  color: indice >= 1   ? "green" : "red" },
    { label: t("margen_utilidad"),  value: margen,   fmt: fmtPct,  color: margen >= 0   ? "green" : "red" }
  ], [totalI, totalE, utilidad, indice, margen, t]);

  // pies
  const [groupBy, setGroupBy] = useState("categoria");

  // barData con fechas crudas (sin formatear) para clave/orden
  const barData = useMemo(
    () =>
      byDate.map(d => ({
        name: d.name,
        ingresos: d.ingresos,
        egresos: d.egresos
      })),
    [byDate]
  );

  // años para mensual
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);

  // apply / clear
  const applyFilter = () => {
    if (mode === "single" && fecha) {
      setParams({ fecha });
    } else if (mode === "range" && desde && hasta) {
      setParams({ from: desde, to: hasta });
    } else if (mode === "mensual" && mes && anio) {
      const mm = mes.padStart(2, "0");
      const lastDay = new Date(Number(anio), Number(mes), 0).getDate();
      const from = `${anio}-${mm}-01`;
      const to   = `${anio}-${mm}-${String(lastDay).padStart(2, "0")}`;
      setParams({ from, to });
    } else {
      setParams({});
    }
  };
  const clearFilter = () => {
    setFecha(""); setDesde(""); setHasta("");
    setMes(""); setAnio("");
    setParams({});
  };

  if (loading) {
    return <p className={styles.loading}>{t("cargando")}…</p>;
  }

  const ingresosPie = groupBy === "categoria" ? ingresosByCategoria : ingresosByTipo;
  const egresosPie  = groupBy === "categoria" ? egresosByCategoria  : egresosByTipo;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("panel_financiero")}</h2>

      {/* FILTRO */}
      <div className={styles.filterBox}>
        <div className={styles.filterGroup}>
          <label>{t("modo_de_filtro")}</label>
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="single">{t("una_sola_fecha")}</option>
            <option value="range">{t("rango_de_fechas")}</option>
            <option value="mensual">{t("mensual")}</option>
          </select>
        </div>

        {mode === "single" && (
          <div className={styles.filterGroup}>
            <label>{t("una_sola_fecha")}</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </div>
        )}

        {mode === "range" && (
          <div className={styles.fieldPair}>
            <div className={styles.filterGroup}>
              <label>{t("desde")}</label>
              <input
                type="date"
                value={desde}
                onChange={e => setDesde(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>{t("hasta")}</label>
              <input
                type="date"
                value={hasta}
                onChange={e => setHasta(e.target.value)}
              />
            </div>
          </div>
        )}

        {mode === "mensual" && (
          <div className={styles.fieldPair}>
            <div className={styles.filterGroup}>
              <label>{t("mes")}</label>
              <select value={mes} onChange={e => setMes(e.target.value)}>
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m).padStart(2,"0")}>
                    {String(m).padStart(2,"0")}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>{t("anio")}</label>
              <select value={anio} onChange={e => setAnio(e.target.value)}>
                <option value="">—</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button onClick={applyFilter} className={styles.filterButton}>
            {t("aplicar_filtro")}
          </button>
          <button onClick={clearFilter} className={styles.filterButton}>
            {t("borrar_filtro")}
          </button>
        </div>
      </div>

      {/* TARJETAS */}
      <div className={styles.cards}>
        {cards.map((c,i) => {
          const Arrow = c.color === "green" ? FaArrowUp : FaArrowDown;
          return (
            <div key={i} className={styles.card}>
              <h3>{c.label}</h3>
              <div className={styles.valueWrapper}>
                <span className={styles[c.color]}>{c.fmt(c.value)}</span>
                <Arrow className={styles[`arrow_${c.color}`]} />
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRA ACUMULADA */}
      <section className={styles.barSection}>
        <h4>{t("ingresos_vs_egresos_acumulado")}</h4>
        <BarComparativo data={barData} xTickFormatter={formatDDMMYYYY} />
      </section>

      {/* TOGGLE TORTAS */}
      <div className={styles.toggleContainer}>
        <button
          onClick={() => setGroupBy(g => g === "categoria" ? "tipo" : "categoria")}
          className={styles.toggleButton}
        >
          {groupBy === "categoria"
            ? t("agrupado_por_tipo")
            : t("agrupado_por_categoria")}
        </button>
      </div>

      {/* TORTAS */}
      <div className={styles.piesContainer}>
        <div className={`${styles.pieBlock} ${styles.pieIngresos}`}>
          <h5>
            {t("ingresos_por")}&nbsp;
            {groupBy === "categoria" ? t("categoria") : t("tipo")}
          </h5>
          <div className={styles.pieWrapper}>
            <PieChartComponent data={ingresosPie} />
          </div>
        </div>
        <div className={`${styles.pieBlock} ${styles.pieEgresos}`}>
          <h5>
            {t("egresos_por")}&nbsp;
            {groupBy === "categoria" ? t("categoria") : t("tipo")}
          </h5>
          <div className={styles.pieWrapper}>
            <PieChartComponent data={egresosPie} />
          </div>
        </div>
      </div>
    </div>
  );
}