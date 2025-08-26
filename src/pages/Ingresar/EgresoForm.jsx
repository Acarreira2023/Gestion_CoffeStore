// src/pages/Ingresar/EgresoForm.jsx

import React, { useState } from "react";
import { Timestamp } from "firebase/firestore";
import styles from "./EgresoForm.module.css";
import { guardarEgreso } from "../../services/firebaseService";
import {
  tiposEgreso,
  sucursales,
  inmuebles,
  mediosEgreso,
  categoriasEgreso
} from "../../utils/listados";
import { useIdioma } from "../../context/IdiomaContext";

export default function EgresoForm({ onBack }) {
  const { t } = useIdioma();
  const [f, setF] = useState({
    fecha: "",
    proyecto: "Proy-",
    tipo: "",
    categoria: "",
    cantidad: 1,
    numeroDoc: "",
    descripcion: "",
    proveedor: "",
    total: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setF((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...f };

    // Fecha a medianoche local
    const [year, month, day] = data.fecha.split("-").map(Number);
    const dtLocal = new Date(year, month - 1, day);
    data.fecha = Timestamp.fromDate(dtLocal);

    const res = await guardarEgreso(data);
    if (res.success) {
      alert(t("egreso_guardado_correctamente"));
      onBack();
    } else {
      alert(t("error_guardar_egreso"));
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit}>
      <h2>{t("formulario_egreso")}</h2>

      {/* Fecha */}
      <div className={styles.field}>
        <label htmlFor="fecha">{t("fecha")}</label>
        <input
          type="date"
          id="fecha"
          name="fecha"
          value={f.fecha}
          onChange={handleChange}
          required
        />
      </div>

      {/* Proyecto con prefijo fijo */}
      <div className={styles.field}>
        <label htmlFor="proyecto">{t("proyecto")}</label>
        <div className={styles.prefijoInput}>
          <span className={styles.prefijo}>Proy-</span>
          <input
            type="text"
            id="proyecto"
            name="proyecto"
            value={f.proyecto.replace(/^Proy-/, "")}
            onChange={(e) =>
              setF((prev) => ({ ...prev, proyecto: `Proy-${e.target.value}` }))
            }
            placeholder={t("nombre_proyecto")}
            required
          />
        </div>
      </div>

      {/* Tipo */}
      <div className={styles.field}>
        <label htmlFor="tipo">{t("tipo")}</label>
        <select
          id="tipo"
          name="tipo"
          value={f.tipo}
          onChange={handleChange}
          required
        >
          <option value="">{t("seleccionar_tipo")}</option>
          {tiposEgreso.map((opt) => (
            <option key={opt} value={opt}>
              {t(opt)}
            </option>
          ))}
        </select>
      </div>

      {/* Categoría */}
      <div className={styles.field}>
        <label htmlFor="categoria">{t("categoria")}</label>
        <select
          id="categoria"
          name="categoria"
          value={f.categoria}
          onChange={handleChange}
        >
          <option value="">{t("seleccionar_categoria")}</option>
          {categoriasEgreso.map((opt) => (
            <option key={opt} value={opt}>
              {t(opt)}
            </option>
          ))}
        </select>
      </div>

      {/* Cantidad */}
      <div className={styles.field}>
        <label htmlFor="cantidad">{t("cantidad")}</label>
        <input
          type="number"
          id="cantidad"
          name="cantidad"
          min="1"
          value={f.cantidad}
          onChange={handleChange}
          required
        />
      </div>

      {/* Proveedor */}
      <div className={styles.field}>
        <label htmlFor="proveedor">{t("proveedor")}</label>
        <input
          type="text"
          id="proveedor"
          name="proveedor"
          value={f.proveedor}
          onChange={handleChange}
        />
      </div>

      {/* Número de documento */}
      <div className={styles.field}>
        <label htmlFor="numeroDoc">{t("numero_documento")}</label>
        <input
          type="text"
          id="numeroDoc"
          name="numeroDoc"
          value={f.numeroDoc}
          onChange={handleChange}
        />
      </div>

      {/* Descripción */}
      <div className={styles.field}>
        <label htmlFor="descripcion">{t("descripcion")}</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={f.descripcion}
          onChange={handleChange}
        />
      </div>

      {/* Total */}
      <div className={styles.field}>
        <label htmlFor="total">{t("total")}</label>
        <input
          type="number"
          id="total"
          name="total"
          step="0.01"
          min="0"
          value={f.total}
          onChange={handleChange}
          required
        />
      </div>

      {/* Botones */}
      <div className={styles.buttons}>
        <button type="submit" className={styles.botonArena}>
          {t("guardar_egreso")}
        </button>
        <button type="button" className={styles.volver} onClick={onBack}>
          {t("volver")}
        </button>
      </div>
    </form>
  );
}