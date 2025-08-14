// src/services/exportService.jsx

/**
 * Servicio para exportar Firestore → XLSX
 * Usa ExcelJS y aplica autofiltro.
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseService";
import ExcelJS from "exceljs";

/**
 * Genera un workbook con una hoja y exporta los datos como archivo XLSX.
 */
async function exportToExcel({ nombreArchivo, nombreHoja, header, rows }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(nombreHoja);

  worksheet.addRow(header);
  rows.forEach(row => {
    worksheet.addRow(header.map(h => row[h]));
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: header.length }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreArchivo}_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Exporta la colección "ingresos"
 */
export async function exportIngresos() {
  const snap = await getDocs(collection(db, "ingresos"));

  const data = snap.docs.map(docSnap => {
    const d = docSnap.data();
    const fecha = d.fecha?.toDate?.().toISOString().slice(0, 10) || "";
    return {
      Fecha:       fecha,
      Tipo:        d.tipo        || "",
      Inmuebles:   d.inmuebles   || "",
      Sucursales:  d.sucursales  || "",
      Medio:       d.medio       || "",
      Categoría:   d.categoria   || "",
      Cantidad:    d.cantidad    ?? "",
      "Nro. Doc":  d.nroDoc      || "",
      Descripción: d.descripcion || "",
      Total:       d.total       || 0
    };
  });

  const header = [
    "Fecha", "Tipo", "Inmuebles", "Sucursales", "Medio",
    "Categoría", "Cantidad", "Nro. Doc", "Descripción", "Total"
  ];

  await exportToExcel({
    nombreArchivo: "ingresos",
    nombreHoja: "Ingresos",
    header,
    rows: data
  });
}

/**
 * Exporta la colección "egresos"
 */
export async function exportEgresos() {
  const snap = await getDocs(collection(db, "egresos"));

  const data = snap.docs.map(docSnap => {
    const d = docSnap.data();
    const fecha = d.fecha?.toDate?.().toISOString().slice(0, 10) || "";
    return {
      Fecha:        fecha,
      "Tipo Gasto": d.tipoGasto    || "",
      Item:         d.item         || "",
      "Marca/Modelo": d.marcaModelo || "",
      "Elementos Especiales": d.elementosEspeciales || "",
      Proveedor:    d.proveedor    || "",
      "Medio Pago": d.medioPago    || "",
      Categoría:    d.categoria    || "",
      "Nro. Doc":   d.nroDoc       || "",
      Descripción:  d.descripcion  || "",
      Total:        d.total        || 0
    };
  });

  const header = [
    "Fecha", "Tipo Gasto", "Item", "Marca/Modelo", "Elementos Especiales", 
    "Proveedor", "Medio Pago", "Categoría", "Nro. Doc", "Descripción", "Total"
  ];

  await exportToExcel({
    nombreArchivo: "egresos",
    nombreHoja: "Egresos",
    header,
    rows: data
  });
}

/**
 * Exporta la colección "presupuestos"
 */
export async function exportPresupuestos() {
  const snap = await getDocs(collection(db, "presupuestos"));

  const data = snap.docs.map(docSnap => {
    const d = docSnap.data();
    const fecha = d.fecha?.toDate?.().toISOString().slice(0, 10) || "";
    const fechaVenta = d.fechaVenta?.toDate?.().toISOString().slice(0, 10) || "";
    return {
      Fecha:        fecha,
      Cliente:      d.cliente      || "",
      Teléfono:     d.telefono     || "",
      Email:        d.email        || "",
      Item:         d.item         || "",
      "Marca/Modelo": d.marcaModelo || "",
      "Elementos Especiales": d.elementosEspeciales || "",
      Proveedor:    d.proveedor    || "",
      Cantidad:     d.cantidad     || 0,
      Total:        d.total        || 0,
      Estado:       d.estado       || "",
      "Fecha Venta": fechaVenta,
      Descripción:  d.descripcion  || "",
      Observaciones: d.observaciones || ""
    };
  });

  const header = [
    "Fecha", "Cliente", "Teléfono", "Email", "Item", "Marca/Modelo", 
    "Elementos Especiales", "Proveedor", "Cantidad", "Total", "Estado", 
    "Fecha Venta", "Descripción", "Observaciones"
  ];

  await exportToExcel({
    nombreArchivo: "presupuestos",
    nombreHoja: "Presupuestos",
    header,
    rows: data
  });
}