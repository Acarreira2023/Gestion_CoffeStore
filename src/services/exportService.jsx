// src/services/exportService.jsx

/**
 * Servicio para exportar Firestore → XLSX
 * Usa SheetJS (xlsx) y aplica autofiltro en la hoja.
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseService";
import * as XLSX from "xlsx";

/**
 * Exporta la colección "ingresos"
 */
export async function exportIngresos() {
  const snap = await getDocs(collection(db, "ingresos"));

  const data = snap.docs.map(docSnap => {
    const d = docSnap.data();
    const fecha = d.fecha?.toDate
      ? d.fecha.toDate().toISOString().slice(0, 10)
      : "";
    return {
      Fecha:       fecha,
      Tipo:        d.tipo        || "",
      Categoría:   d.categoria   || "",
      Cantidad:    d.cantidad  != null ? d.cantidad : "",
      "Nro. Doc":  d.nroDoc      || "",
      Descripción: d.descripcion || "",
      Total:       d.total       || 0
    };
  });

  const header = [
    "Fecha","Tipo","Categoría","Cantidad","Nro. Doc","Descripción","Total"
  ];

  // genera worksheet a partir de JSON
  const ws = XLSX.utils.json_to_sheet(data, {
    header,
    skipHeader: false
  });

  // define rango completo (A1 hasta última columna+número de filas)
  const range = XLSX.utils.decode_range(ws["!ref"]);
  // coloca autofiltro en la primera fila
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({
    s: { r: 0, c: range.s.c },
    e: { r: range.s.r, c: range.e.c }
  })};

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
  XLSX.writeFile(wb, `ingresos_${Date.now()}.xlsx`);
}

/**
 * Exporta la colección "egresos"
 */
export async function exportEgresos() {
  const snap = await getDocs(collection(db, "egresos"));

  const data = snap.docs.map(docSnap => {
    const d = docSnap.data();
    const fecha = d.fecha?.toDate
      ? d.fecha.toDate().toISOString().slice(0, 10)
      : "";
    return {
      Fecha:        fecha,
      Tipo:         d.tipo         || "",
      Categoría:    d.categoria    || "",
      "Nro. Doc":   d.nroDoc       || "",
      Descripción:  d.descripcion  || "",
      Proveedor:    d.proveedor    || "",
      Total:        d.total        || 0
    };
  });

  const header = [
    "Fecha","Tipo","Categoría","Nro. Doc","Descripción","Proveedor","Total"
  ];

  const ws = XLSX.utils.json_to_sheet(data, {
    header,
    skipHeader: false
  });

  const range = XLSX.utils.decode_range(ws["!ref"]);
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({
    s: { r: 0, c: range.s.c },
    e: { r: range.s.r, c: range.e.c }
  })};

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Egresos");
  XLSX.writeFile(wb, `egresos_${Date.now()}.xlsx`);
}