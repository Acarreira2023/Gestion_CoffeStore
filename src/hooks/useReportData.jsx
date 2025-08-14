// src/hooks/useReportData.jsx

import { useMemo } from "react";
import { useIngresosRealtime } from "./useIngresosRealtime";
import { useEgresosRealtime }  from "./useEgresosRealtime";
import { toDate, esMismoDia, esMismoMes, addDays } from "../utils/dateUtils";
import {
  tiposIngreso,
  items,
  categoriasIngreso,
  tiposGasto,
  categoriasEgreso
} from "../utils/listados";

export function useReportData(params = {}) {
  const { ingresos, loading: loadingI } = useIngresosRealtime();
  const { egresos,  loading: loadingE } = useEgresosRealtime();
  const loading = loadingI || loadingE;

  return useMemo(() => {
    // Determinar modo y rango
    const hoy = new Date();
    const firstOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    let mode = "month";              // mes en curso
    let fecha, from, to;

    if (params.fecha) {
      mode = "single";
      fecha = toDate(params.fecha);
    } else if (params.from && params.to) {
      mode = "range";
      from = toDate(params.from);
      to   = toDate(params.to);
    }

    // helper valor numérico
    const getVal = it => Number(it.total ?? it.valor ?? 0);

    // filtrar según modo
    let filtI = ingresos;
    let filtE = egresos;

    if (mode === "single") {
      filtI = ingresos.filter(i => esMismoDia(toDate(i.fecha), fecha));
      filtE = egresos.filter(e => esMismoDia(toDate(e.fecha), fecha));
      // rango de un día para byDate
      from = fecha;
      to   = fecha;
    }
    else if (mode === "range") {
      filtI = ingresos.filter(i => {
        const d = toDate(i.fecha);
        return d && d >= from && d <= to;
      });
      filtE = egresos.filter(e => {
        const d = toDate(e.fecha);
        return d && d >= from && d <= to;
      });
    }
    else { // month
      filtI = ingresos.filter(i => esMismoMes(toDate(i.fecha), hoy));
      filtE = egresos.filter(e => esMismoMes(toDate(e.fecha), hoy));
      from = firstOfMonth;
      to   = hoy;
    }

    // construir acumulado diario
    const raw = {};
    const addToRaw = (dObj, source) => {
      const d = toDate(source.fecha);
      const key = d.toISOString().slice(0,10);
      raw[key] = raw[key] || { ingresos:0, egresos:0 };
      raw[key][dObj] += getVal(source);
    };
    filtI.forEach(i => addToRaw("ingresos", i));
    filtE.forEach(e => addToRaw("egresos", e));

    const days = Object.entries(raw)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a,b) => new Date(a.name) - new Date(b.name));

    let cumI = 0, cumE = 0;
    const byDate = days.map(({ name, ingresos, egresos }) => {
      cumI += ingresos;
      cumE += egresos;
      return { name, ingresos: cumI, egresos: cumE };
    });

    // función para armar tortas
    const mkPie = (arr, keys, field) =>
      keys
        .map(k => ({
          name:  k,
          value: arr
            .filter(item => item[field] === k)
            .reduce((s, it) => s + getVal(it), 0)
        }))
        .filter(x => x.value > 0);

    const ingresosByTipo      = mkPie(filtI, tiposIngreso,      "tipo");
    const ingresosByItem      = mkPie(filtI, items,            "item");
    const ingresosByCategoria = mkPie(filtI, categoriasIngreso, "categoria");
    const egresosByTipo       = mkPie(filtE, tiposGasto,       "tipoGasto");
    const egresosByItem       = mkPie(filtE, items,            "item");
    const egresosByCategoria  = mkPie(filtE, categoriasEgreso,  "categoria");

    return {
      loading,
      byDate,
      ingresosByTipo,
      ingresosByItem,
      ingresosByCategoria,
      egresosByTipo,
      egresosByItem,
      egresosByCategoria
    };
  }, [ingresos, egresos, params.fecha, params.from, params.to, loading]);
}