// src/pages/Datos/Egreso/Egreso.jsx

import React, { useState, useEffect } from "react";
import { useIdioma } from "../../../context/IdiomaContext";
import { db } from "../../../services/firebaseService";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { endOfMonth } from "date-fns";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import styles from "../Ingreso/Ingreso.module.css";

export default function Egreso() {
  const { t } = useIdioma();

  // filtros
  const [mode, setMode]       = useState("single");
  const [fecha, setFecha]     = useState("");
  const [desde, setDesde]     = useState("");
  const [hasta, setHasta]     = useState("");
  const [mes, setMes]         = useState("");
  const [anio, setAnio]       = useState("");
  const [filterParams, setFilterParams] = useState({});

  // datos y UI
  const [egresos, setEgresos] = useState([]);
  const [selEg, setSelEg]     = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState({
    proyecto: "",
    categoria: "",
    tipo: "",
    proveedor: "",
    total: ""
  });

  // años para filtro mensual
  const currentYear = new Date().getFullYear();
  const years       = Array.from({ length: 6 }, (_, i) => currentYear - i);


  // convierte "YYYY-MM-DD" a Timestamp en UTC-3 sin corrimiento
  const dateStrToTsUTC3 = str => {
    const [y, m, d] = str.split("-").map(Number);
    // creamos UTC date 03:00 para fijar la medianoche local
    const dt = new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
    return Timestamp.fromDate(dt);
  };

  // normaliza un raw Firestore Timestamp a Date UTC puro (00:00)
  const normalizeDateUTC = raw => {
    const d = raw.toDate
      ? raw.toDate()
      : raw.seconds
        ? new Date(raw.seconds * 1000)
        : new Date(raw);
    const y = d.getUTCFullYear();
    const M = d.getUTCMonth();
    const D = d.getUTCDate();
    return new Date(Date.UTC(y, M, D));
  };



  // arma la consulta sumando un día al final
  const buildQuery = () => {
    const col = collection(db, "egresos");
    let q   = col;
    const p = filterParams;

    if (p.mode === "single" && p.fecha) {
      const t0 = dateStrToTsUTC3(p.fecha);
      const t1 = Timestamp.fromDate(
        new Date(t0.toDate().getTime() + 86400000)
      );
      q = query(col,
        where("fecha", ">=", t0),
        where("fecha", "<",  t1),
        orderBy("fecha", "desc")
      );

    } else if (p.mode === "range" && p.desde && p.hasta) {
      const t0 = dateStrToTsUTC3(p.desde);
      const t1 = Timestamp.fromDate(
        new Date(dateStrToTs(p.hasta).toDate().getTime() + 86400000)
      );
      q = query(col,
        where("fecha", ">=", t0),
        where("fecha", "<",  t1),
        orderBy("fecha", "desc")
      );

    } else if (p.mode === "mensual" && p.mes && p.anio) {
      const first = new Date(p.anio, Number(p.mes) - 1, 1, 0, 0, 0);
      let last = endOfMonth(first);
      last.setHours(0,0,0,0);
      const t0 = Timestamp.fromDate(first);
      const t1 = Timestamp.fromDate(
        new Date(last.getTime() + 86400000)
      );
      q = query(col,
        where("fecha", ">=", t0),
        where("fecha", "<",  t1),
        orderBy("fecha", "desc")
      );

    } else {
      q = query(col, orderBy("fecha", "desc"));
    }

    return q;
  };

    useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(buildQuery());

        // ← Aquí empieza tu map
        const list = snap.docs.map(docSnap => {
          const data = docSnap.data();

          // Normalizamos la fecha a UTC puro
          const day = normalizeDateUTC(data.fecha);
          const dd  = String(day.getUTCDate()).padStart(2, "0");
          const mm  = String(day.getUTCMonth() + 1).padStart(2, "0");
          const yyyy = day.getUTCFullYear();

          return {
            id:        data.id || docSnap.id,
            fecha:     `${dd}/${mm}/${yyyy}`,    // ← Aquí va la fecha formateada
            proyecto:  data.proyecto || "",
            categoria: data.categoria || "",
            tipo:      data.tipo      || "",
            proveedor: data.proveedor || "",
            total:     data.total     || 0
          };
        });
        // ← Aquí termina tu map

        setEgresos(list);
      setSelEg(new Set());
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterParams]);


  // aplicar y limpiar filtros
  const applyFilter = () =>
    setFilterParams({ mode, fecha, desde, hasta, mes, anio });
  const clearFilter = () => {
    setMode("single");
    setFecha(""); setDesde(""); setHasta("");
    setMes("");   setAnio("");
    setFilterParams({});
  };

  // selección y borrado
  const toggleSelect   = id => {
    setSelEg(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const selectAll      = () =>
    setSelEg(prev =>
      prev.size === egresos.length
        ? new Set()
        : new Set(egresos.map(e => e.id))
    );
  const deleteSelected = async () => {
    for (let id of selEg) await deleteDoc(doc(db, "egresos", id));
    setEgresos(prev => prev.filter(e => !selEg.has(e.id)));
    setSelEg(new Set());
  };
  const deleteOne      = async id => {
    await deleteDoc(doc(db, "egresos", id));
    setEgresos(prev => prev.filter(e => e.id !== id));
    setSelEg(prev => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  // edición inline
  const startEdit  = row => {
    setEditingId(row.id);
    setEditData({
      proyecto: row.proyecto,
      categoria: row.categoria,
      tipo:      row.tipo,
      proveedor: row.proveedor,
      total:     row.total.toString()
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ proyecto: "", categoria: "", tipo: "", proveedor: "", total: "" });
  };
  const saveEdit   = async id => {
    const ref = doc(db, "egresos", id);
    await updateDoc(ref, {
      proyecto:  editData.proyecto,
      categoria: editData.categoria,
      tipo:      editData.tipo,
      proveedor: editData.proveedor,
      total:     Number(editData.total)
    });
    setEgresos(prev =>
      prev.map(e =>
        e.id === id
          ? { ...e, ...editData, total: Number(editData.total) }
          : e
      )
    );
    cancelEdit();
  };

  if (loading)
    return <p className={styles.status}>{t("cargando_resumen")}…</p>;
  if (error)
    return <p className={styles.status}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("egresos")}</h2>

      {/* FILTRO */}
      <div className={styles.filterBox}>
        <div className={styles.filterGroup}>
          <label>{t("modo_de_filtro")}</label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value)}
          >
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
              <select
                value={mes}
                onChange={e => setMes(e.target.value)}
              >
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m).padStart(2, "0")}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>{t("anio")}</label>
              <select
                value={anio}
                onChange={e => setAnio(e.target.value)}
              >
                <option value="">—</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button
            className={styles.filterButton}
            onClick={applyFilter}
          >
            {t("aplicar_filtro")}
          </button>
          <button
            className={styles.filterButton}
            onClick={clearFilter}
          >
            {t("borrar_filtro")}
          </button>
        </div>
      </div>

      {/* ACCIONES */}
      <div className={styles.actions}>
        <button onClick={selectAll}>{t("seleccionar_todos")}</button>
        <button
          disabled={!selEg.size}
          onClick={deleteSelected}
        >
          {t("borrar_seleccionados")}
        </button>
      </div>

      {/* TABLA */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selEg.size === egresos.length}
                onChange={selectAll}
              />
            </th>
            <th>{t("fecha")}</th>
            <th>{t("proyecto")}</th>
            <th>{t("categoria")}</th>
            <th>{t("tipo")}</th>
            <th>{t("proveedor")}</th>
            <th>{t("total")}</th>
            <th>{t("acciones")}</th>
          </tr>
        </thead>
        <tbody>
          {egresos.map(r => (
            <tr key={r.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selEg.has(r.id)}
                  onChange={() => toggleSelect(r.id)}
                />
              </td>
              <td>{r.fecha}</td>
              <td>
                {editingId === r.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.proyecto}
                    onChange={e =>
                      setEditData(d => ({ ...d, proyecto: e.target.value }))
                    }
                  />
                ) : (
                  r.proyecto
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.categoria}
                    onChange={e =>
                      setEditData(d => ({ ...d, categoria: e.target.value }))
                    }
                  />
                ) : (
                  r.categoria
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.tipo}
                    onChange={e =>
                      setEditData(d => ({ ...d, tipo: e.target.value }))
                    }
                  />
                ) : (
                  r.tipo
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.proveedor}
                    onChange={e =>
                      setEditData(d => ({ ...d, proveedor: e.target.value }))
                    }
                  />
                ) : (
                  r.proveedor
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.total}
                    onChange={e =>
                      setEditData(d => ({ ...d, total: e.target.value }))
                    }
                  />
                ) : (
                  `$${r.total}`
                )}
              </td>
              <td className={styles.rowActions}>
                {editingId === r.id ? (
                  <>
                    <button onClick={() => saveEdit(r.id)}>
                      <FaSave />
                    </button>
                    <button onClick={cancelEdit}>
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(r)}
                      className={styles.editBtn}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteOne(r.id)}
                      className={styles.deleteBtn}
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}