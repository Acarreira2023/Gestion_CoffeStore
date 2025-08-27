// src/hooks/useReportData.jsx

import { useMemo } from "react";
import { useIngresosRealtime } from "./useIngresosRealtime";
import { useEgresosRealtime }  from "./useEgresosRealtime";
import { toDate, esMismoDia, esMismoMes, addDays } from "../utils/dateUtils";
import {
  tiposIngreso,
  categoriasIngreso,
  tiposEgreso,
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

    let mode = "month";
    let fecha, from, to;

    if (params.fecha) {
      mode = "single";
      fecha = toDate(params.fecha);
    } else if (params.from && params.to) {
      mode = "range";
      from = toDate(params.from);
      to   = toDate(params.to);
    }

    const getVal = it => Number(it.total ?? it.valor ?? 0);

    let filtI = ingresos;
    let filtE = egresos;

    if (mode === "single") {
      filtI = ingresos.filter(i => esMismoDia(toDate(i.fecha), fecha));
      filtE = egresos.filter(e => esMismoDia(toDate(e.fecha), fecha));
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
    else {
      filtI = ingresos.filter(i => esMismoMes(toDate(i.fecha), hoy));
      filtE = egresos.filter(e => esMismoMes(toDate(e.fecha), hoy));
      from = firstOfMonth;
      to   = hoy;
    }

    // Acumulado diario con relleno
    const raw = {};
    const addToRaw = (dObj, source) => {
      const d = toDate(source.fecha);
      const key = d.toLocaleDateString("es-AR");
      raw[key] = raw[key] || { ingresos: 0, egresos: 0 };
      raw[key][dObj] += getVal(source);
    };
    filtI.forEach(i => addToRaw("ingresos", i));
    filtE.forEach(e => addToRaw("egresos", e));

    // Generar todos los días del rango
    const allDays = [];
    let d = new Date(from);
    d.setHours(0,0,0,0);
    const end = new Date(to);
    end.setHours(0,0,0,0);
    while (d <= end) {
      allDays.push(d.toLocaleDateString("es-AR"));
      d = addDays(d, 1);
    }

    // Completar días faltantes con ceros
    const days = allDays.map(name => ({
      name,
      ingresos: raw[name]?.ingresos || 0,
      egresos: raw[name]?.egresos || 0
    }));

    // Ordenar por fecha
    days.sort((a, b) => {
      const da = new Date(a.name.split("/").reverse().join("-"));
      const db = new Date(b.name.split("/").reverse().join("-"));
      return da - db;
    });

    const byDate = days.map(({ name, ingresos, egresos }) => ({
      name,
      ingresos,
      egresos
    }));

    // función para armar tortas
    const mkPie = (arr, keys, field) =>
      keys.map(k => ({
        name: k,
        value: arr
          .filter(item => (item[field] || "").toUpperCase() === k.toUpperCase())
          .reduce((s, it) => s + getVal(it), 0)
      }))
      .filter(x => x.value > 0);

    const ingresosByTipo      = mkPie(filtI, tiposIngreso,      "tipo");
    const ingresosByCategoria = mkPie(filtI, categoriasIngreso, "categoria");
    const egresosByTipo       = mkPie(filtE, tiposEgreso,       "tipo");
    const egresosByCategoria  = mkPie(filtE, categoriasEgreso,  "categoria");

    return {
      loading,
      byDate,
      ingresosByTipo,
      ingresosByCategoria,
      egresosByTipo,
      egresosByCategoria
    };
  }, [ingresos, egresos, params.fecha, params.from, params.to, loading]);
}