// src/pages/Ingresar/FileImporter.jsx

import React, { useRef, useState } from "react";
import ExcelJS from "exceljs";
import { Timestamp } from "firebase/firestore";
import { subirIngresos, subirEgresos } from "../../services/firebaseService";
import { useIdioma } from "../../context/IdiomaContext";
import styles from "./Ingresar.module.css";

export default function FileImporter({ tipo, onBack }) {
  const { t } = useIdioma();
  const fileRef = useRef();
  const [isProcessing, setIsProcessing] = useState(false);

  // exceljs no soporta .xls (BIFF). Mantengo .csv y .xlsx.
  const accept = ".csv,.xlsx";

  // —————————————— Helpers ——————————————

  const stripAccents = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const headerAliases = {
    fecha: ["fecha", "date", "fecha operacion", "fecha operación", "dia", "día"],
    total: ["total", "importe", "monto", "valor", "amount", "precio"],
    descripcion: [
      "descripcion",
      "descripción",
      "detalle",
      "concepto",
      "nota",
      "description",
    ],
    categoria: ["categoria", "categoría", "rubro", "clase", "category"],
  };

  const toCanonicalHeader = (raw) => {
    const h = stripAccents(raw);
    for (const [canonical, aliases] of Object.entries(headerAliases)) {
      if (aliases.includes(h)) return canonical;
    }
    return h; // deja otros headers tal cual (normalizados)
  };

  const toCanonicalHeaders = (headers) => headers.map(toCanonicalHeader);

  // Detecta delimitador probable usando la primera línea
  const detectDelimiter = (line) => {
    const counts = [
      [",", (line.match(/,/g) || []).length],
      [";", (line.match(/;/g) || []).length],
      ["\t", (line.match(/\t/g) || []).length],
    ];
    counts.sort((a, b) => b[1] - a[1]);
    return counts[0][1] > 0 ? counts[0][0] : ",";
  };

  // CSV parser simple con comillas (maneja "valor, con, comas" y ""comillas"")
  const parseCSV = (text) => {
    const src = String(text || "").replace(/^\uFEFF/, ""); // quita BOM
    const delimiter = detectDelimiter(src.split(/\r?\n/)[0] || ",");
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    const pushCell = () => {
      row.push(cur);
      cur = "";
    };
    const pushRow = () => {
      // Evita filas vacías puras
      if (row.some((c) => c != null && String(c).trim() !== "")) {
        rows.push(row);
      }
      row = [];
    };

    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === delimiter) {
          pushCell();
        } else if (ch === "\n") {
          pushCell();
          pushRow();
        } else if (ch === "\r") {
          // ignore, \r\n handled by \n
        } else {
          cur += ch;
        }
      }
    }
    // último valor/última fila
    pushCell();
    pushRow();
    return rows.map((r) => r.map((c) => String(c).trim()));
  };

  // Parseo de números en formatos locales: "1.234,56" o "1,234.56"
  const parseNumberLocale = (v) => {
    if (v == null || v === "") return null;
    if (typeof v === "number") return v;
    let s = String(v).trim();
    // Si es algo tipo "1 234,56" o "1 234.56", quitamos espacios
    s = s.replace(/\s+/g, "");

    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    // Determinamos el separador decimal por la última aparición
    if (lastComma > lastDot) {
      // decimal es coma → quitamos puntos de miles
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (lastDot > lastComma) {
      // decimal es punto → quitamos comas de miles
      s = s.replace(/,/g, "");
    } else {
      // no hay separador claro, dejar como está
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  // Excel serial (1900 date system) → Date local medianoche
  const excelSerialToDateLocal = (serial) => {
    if (!Number.isFinite(serial)) return null;
    // Excel cuenta desde 1899-12-31 (con bug del 1900 leap year)
    const utc = new Date(Date.UTC(1899, 11, 30)); // compensado
    const ms = Math.round(serial * 86400 * 1000);
    const d = new Date(utc.getTime() + ms);
    // Nos quedamos con la parte de fecha en local, medianoche
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Normaliza cualquier valor de fecha a Date local (medianoche)
  const parseFileDate = (v) => {
    if (v == null || v === "") return null;

    if (v instanceof Date && !isNaN(v.getTime())) {
      return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    }

    if (typeof v === "number") {
      // serial de Excel
      const d = excelSerialToDateLocal(v);
      return d && !isNaN(d.getTime()) ? d : null;
    }

    const s = String(v).trim();

    // DD/MM/YYYY o D/M/YYYY
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const [_, dd, mm, yyyy] = m.map(Number);
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }

    // YYYY-MM-DD
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, yyyy, mm, dd] = m.map(Number);
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }

    // Fallback ISO o parse nativo
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    return null;
  };

  const requireHeaders = (headers) => {
    const set = new Set(headers);
    return set.has("fecha") && set.has("total");
  };

  // —————————————— Core ——————————————

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "xls") {
      alert(t("encabezado_no_encontrado") || "Formato .xls no soportado. Usá .xlsx o .csv.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setIsProcessing(false);
      alert(t("error_leyendo_archivo"));
    };

    reader.onload = async (evt) => {
      try {
        let rows = [];

        if (ext === "csv") {
          const txt = String(evt.target.result || "");
          rows = parseCSV(txt);
        } else {
          const data = new Uint8Array(evt.target.result);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          const worksheet = workbook.worksheets[0];
          if (!worksheet) throw new Error("No worksheet found");

          rows = [];
          worksheet.eachRow((row) => {
            // row.values[0] es undefined; slice(1)
            const values = row.values.slice(1).map((v) => {
              // ExcelJS puede traer objetos complejos; simplificamos:
              if (v && typeof v === "object") {
                if (v.text != null) return String(v.text);
                if (v.result != null) return v.result; // fórmula evaluada
                if (v.richText != null)
                  return v.richText.map((p) => p.text).join("");
              }
              return v;
            });
            rows.push(values);
          });
        }

        if (!rows.length) {
          alert(t("sin_datos_validos"));
          setIsProcessing(false);
          return;
        }

        // Buscar encabezado
        const headerIdx = rows.findIndex((r) => {
          const headers = toCanonicalHeaders(r);
          return requireHeaders(headers);
        });

        if (headerIdx < 0) {
          alert(t("encabezado_no_encontrado"));
          setIsProcessing(false);
          return;
        }

        const rawHeaders = rows[headerIdx];
        const headers = toCanonicalHeaders(rawHeaders);
        const dataRows = rows.slice(headerIdx + 1);

        // Construcción de objetos normalizados
        const objetos = dataRows
          .map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              const v = r[i];
              if (v !== "" && v != null) obj[h] = v;
            });

            // Fecha
            if (obj.fecha != null) {
              const dt = parseFileDate(obj.fecha);
              if (dt) obj.fecha = Timestamp.fromDate(dt);
              else delete obj.fecha;
            }

            // Total
            if (obj.total != null) {
              const n = parseNumberLocale(obj.total);
              if (n != null) obj.total = n;
              else delete obj.total;
            }

            return obj;
          })
          .filter(
            (o) =>
              o &&
              o.fecha instanceof Timestamp &&
              typeof o.total === "number" &&
              o.total > 0
          );

        if (!objetos.length) {
          alert(t("sin_datos_validos"));
          setIsProcessing(false);
          return;
        }

        if (tipo === "ingreso") {
          await subirIngresos(objetos);
          alert(t("ingresos_importados_correctamente"));
        } else {
          await subirEgresos(objetos);
          alert(t("egresos_importados_correctamente"));
        }

        onBack();
      } catch (err) {
        console.error("Error procesando archivo:", err);
        alert(t("error_procesando_archivo"));
      } finally {
        setIsProcessing(false);
      }
    };

    if (ext === "csv") reader.readAsText(file, "UTF-8");
    else reader.readAsArrayBuffer(file);
  };

  return (
    <div className={styles.content}>
      <h2>{tipo === "ingreso" ? t("archivo_ingreso") : t("archivo_egreso")}</h2>

      <input
        type="file"
        accept={accept}
        style={{ display: "none" }}
        ref={fileRef}
        onChange={handleFile}
        disabled={isProcessing}
      />

      <button onClick={() => fileRef.current?.click()} disabled={isProcessing}>
        {isProcessing ? "⏳" : t("seleccionar_archivo")}
      </button>

      <button className={styles.back} onClick={onBack} disabled={isProcessing}>
        {t("volver")}
      </button>
    </div>
  );
}