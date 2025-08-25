// src/pages/Datos/Ingreso/Ingreso.jsx

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
  doc
} from "firebase/firestore";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import styles from "./Ingreso.module.css";

export default function Ingreso() {
  const { t } = useIdioma();

  // filtros
  const [mode, setMode]               = useState("single");
  const [fecha, setFecha]             = useState("");
  const [desde, setDesde]             = useState("");
  const [hasta, setHasta]             = useState("");
  const [mes, setMes]                 = useState("");
  const [anio, setAnio]               = useState("");
  const [filterParams, setFilterParams] = useState({});

  // datos y selección
  const [ingresos, setIngresos] = useState([]);
  const [selIn, setSelIn]       = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // edición inline
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState({
    categoria: "",
    tipo: "",
    total: ""
  });

  // años para filtro mensual
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // recarga datos al cambiar filtros
  useEffect(() => {
    async function loadIngresos() {
      setLoading(true);
      setError(null);

      const endOf = date => {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        return d;
      };

      function buildQuery() {
        let q = collection(db, "ingresos");
        const { mode, fecha, desde, hasta, mes, anio } = filterParams;

        if (mode === "single" && fecha) {
          const d0 = new Date(fecha);
          q = query(
            q,
            where("fecha", ">=", d0),
            where("fecha", "<", endOf(d0)),
            orderBy("fecha", "desc")
          );
        } else if (mode === "range" && desde && hasta) {
          const d0 = new Date(desde), d1 = endOf(hasta);
          q = query(
            q,
            where("fecha", ">=", d0),
            where("fecha", "<", d1),
            orderBy("fecha", "desc")
          );
        } else if (mode === "mensual" && mes && anio) {
          const mm = mes.padStart(2, "0");
          const start = new Date(`${anio}-${mm}-01`);
          const end   = endOf(new Date(anio, +mes, 0));
          q = query(
            q,
            where("fecha", ">=", start),
            where("fecha", "<", end),
            orderBy("fecha", "desc")
          );
        } else {
          q = query(q, orderBy("fecha", "desc"));
        }
        return q;
      }

      try {
        const snap = await getDocs(buildQuery());
        const list = snap.docs.map(d => {
          const data = d.data();
          const ts   = data.fecha;
          const date = ts?.toDate
            ? ts.toDate()
            : ts instanceof Date
            ? ts
            : ts?.seconds
            ? new Date(ts.seconds * 1000)
            : new Date(ts);
          return {
            id:        d.id,
            fecha:     date.toLocaleDateString(),
            proyecto:  data.proyecto ?? "",
            categoria: data.categoria ?? "",
            tipo:      data.tipo ?? "",
            total:     data.total ?? 0
          };
        });
        setIngresos(list);
        setSelIn(new Set());
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadIngresos();
  }, [filterParams]);

  // aplicar / limpiar filtro
  const applyFilter = () =>
    setFilterParams({ mode, fecha, desde, hasta, mes, anio });
  const clearFilter = () => {
    setMode("single");
    setFecha(""); setDesde(""); setHasta("");
    setMes(""); setAnio("");
    setFilterParams({});
  };

  // selección masiva
  const toggleSelect = id => {
    setSelIn(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const handleSelectAll = () =>
    setSelIn(prev =>
      prev.size === ingresos.length
        ? new Set()
        : new Set(ingresos.map(i => i.id))
    );
  const handleDeleteSelected = async () => {
    for (let id of selIn) {
      await deleteDoc(doc(db, "ingresos", id));
    }
    setIngresos(prev => prev.filter(i => !selIn.has(i.id)));
    setSelIn(new Set());
  };
  const deleteOne = async id => {
    await deleteDoc(doc(db, "ingresos", id));
    setIngresos(prev => prev.filter(i => i.id !== id));
    setSelIn(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  // edición inline
  const startEdit = row => {
    setEditingId(row.id);
    setEditData({
      proyecto:  row.proyecto,
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
  const saveEdit = async id => {
    const ref = doc(db, "ingresos", id);
    await updateDoc(ref, {
      proyecto:  editData.proyecto,
      categoria: editData.categoria,
      tipo:      editData.tipo,
      total:     Number(editData.total)
    });
    setIngresos(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, ...editData, total: Number(editData.total) }
          : i
      )
    );
    cancelEdit();
  };

  if (loading) return <p className={styles.status}>{t("cargando_resumen")}…</p>;
  if (error)   return <p className={styles.status}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("datos_ingresos")}</h2>

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
                  <option key={m} value={String(m).padStart(2, "0")}>
                    {String(m).padStart(2, "0")}
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

      {/* ACCIONES GLOBALES */}
      <div className={styles.actions}>
        <button onClick={handleSelectAll}>
          {t("seleccionar_todos")}
        </button>
        <button
          disabled={!selIn.size}
          onClick={handleDeleteSelected}
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
                checked={selIn.size === ingresos.length}
                onChange={handleSelectAll}
              />
            </th>
            <th>{t("fecha")}</th>
            <th>{t("proyecto")}</th>
            <th>{t("categoria")}</th>
            <th>{t("tipo")}</th>
            <th>{t("total")}</th>
            <th>{t("acciones")}</th>
          </tr>
        </thead>
        <tbody>
          {ingresos.map(row => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selIn.has(row.id)}
                  onChange={() => toggleSelect(row.id)}
                />
              </td>
              <td>{row.fecha}</td>
              <td>
                {editingId === row.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.proyecto}
                    onChange={e =>
                      setEditData(prev => ({ ...prev, proyecto: e.target.value }))
                    }
                  />
                ) : (
                  row.proyecto
                )}
              </td>
              <td>
                {editingId === row.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.categoria}
                    onChange={e =>
                      setEditData(prev => ({ ...prev, categoria: e.target.value }))
                    }
                  />
                ) : (
                  row.categoria
                )}
              </td>
              <td>
                {editingId === row.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.tipo}
                    onChange={e =>
                      setEditData(prev => ({ ...prev, tipo: e.target.value }))
                    }
                  />
                ) : (
                  row.tipo
                )}
              </td>
              <td>
                {editingId === row.id ? (
                  <input
                    className={styles.editInput}
                    value={editData.total}
                    onChange={e =>
                      setEditData(prev => ({ ...prev, total: e.target.value }))
                    }
                  />
                ) : (
                  `$${row.total}`
                )}
              </td>
              <td className={styles.rowActions}>
                {editingId === row.id ? (
                  <>
                    <button onClick={() => saveEdit(row.id)}>
                      <FaSave />
                    </button>
                    <button onClick={cancelEdit}>
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(row)} className={styles.editBtn}>
                      <FaEdit />
                    </button>
                    <button onClick={() => deleteOne(row.id)} className={styles.deleteBtn}>
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