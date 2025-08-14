// src/pages/Ingresar/FileImporter.jsx

import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { Timestamp } from "firebase/firestore";
import { subirIngresos, subirEgresos } from "../../services/firebaseService";
import { useIdioma } from "../../context/IdiomaContext";
import styles from "./Ingresar.module.css";

export default function FileImporter({ tipo, onBack }) {
  const { t } = useIdioma();
  const fileRef = useRef();
  const accept = ".csv,.xlsx,.xls";

  /**
   * Convierte un valor de Excel/string a JS Date local (medianoche),
   * de modo que Firestore guarde el mismo día en UTC−3.
   */
  const parseFileDate = (v) => {
    let dt;

    if (typeof v === "number") {
      // Excel serial date → timestamp UTC en ms
      const utcDays = v - 25569;
      const utcMs   = utcDays * 86400 * 1000;
      // Ajuste de zona: convierte esa medianoche UTC a medianoche local
      const offsetMs = new Date(utcMs).getTimezoneOffset() * 60000;
      dt = new Date(utcMs + offsetMs);

    } else if (typeof v === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
      // Cadena "DD/MM/YYYY" → medianoche local
      const [d, m, y] = v.split("/").map(Number);
      dt = new Date(y, m - 1, d);

    } else if (v instanceof Date) {
      dt = v;

    } else {
      dt = new Date(v);
    }

    return isNaN(dt.getTime()) ? null : dt;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      alert(t("error_leyendo_archivo"));
    };

    reader.onload = async (evt) => {
      try {
        // 1) Leer todas las filas
        let rows = [];
        if (ext === "csv") {
          const txt = evt.target.result;
          rows = txt.split(/\r?\n/).map(r => r.split(",").map(c => c.trim()));
        } else {
          const data = new Uint8Array(evt.target.result);
          const wb   = XLSX.read(data, { type: "array" });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
        }

        // 2) Buscar fila de encabezados
        const headerIdx = rows.findIndex(r => {
          const low = r.map(c => String(c).toLowerCase());
          return low.includes("fecha") && low.includes("total");
        });
        if (headerIdx < 0) {
          alert(t("encabezado_no_encontrado"));
          return;
        }

        const rawHeaders = rows[headerIdx];
        const dataRows   = rows.slice(headerIdx + 1);
        const headers    = rawHeaders.map(h => String(h || "").trim().toLowerCase());

        // 3) Construir objetos para subir
        const objetos = dataRows
          .filter(r => r.some(c => c !== "" && c != null))
          .map(r => {
            const obj = {};
            headers.forEach((h, i) => {
              const v = r[i];
              if (v !== "" && v != null) obj[h] = v;
            });
            // Fecha → Timestamp (medianoche local)
            /*if (obj.fecha != null) {
              const dt = parseFileDate(obj.fecha);
              if (dt) obj.fecha = Timestamp.fromDate(dt);
            }*/
           if (obj.fecha != null) {
              const dt = parseFileDate(obj.fecha);
              if (dt) {
                dt.setHours(0, 0, 0, 0); // Fuerza medianoche local
                obj.fecha = Timestamp.fromDate(dt);
              }
            }
            // Total → Number
            if (obj.total != null) {
              obj.total = Number(obj.total) || 0;
            }
            return obj;
          })
          .filter(o => o.total > 0);

        if (!objetos.length) {
          alert(t("sin_datos_validos"));
          return;
        }

        // 4) Subir batch
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
      }
    };

    // Leer archivo
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
      />
      <button onClick={() => fileRef.current.click()}>
        {t("seleccionar_archivo")}
      </button>
      <button className={styles.back} onClick={onBack}>
        {t("volver")}
      </button>
    </div>
  );
}