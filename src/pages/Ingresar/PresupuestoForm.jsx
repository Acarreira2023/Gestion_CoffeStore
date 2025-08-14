// src/pages/Ingresar/PresupuestoForm.jsx

import React, { useState } from "react";
import { Timestamp } from "firebase/firestore";
import styles from "./PresupuestoForm.module.css";
import { usePresupuestosCrud } from "../../hooks/usePresupuestosCrud";
import {
  items,
  marcasModelos,
  elementosEspeciales,
  proveedores
} from "../../utils/listados";
import { useIdioma } from "../../context/IdiomaContext";

export default function PresupuestoForm({ onBack }) {
  const { t } = useIdioma();
  const { createPresupuesto } = usePresupuestosCrud();
  const [f, setF] = useState({
    fecha: "",
    cliente: "",
    telefono: "",
    email: "",
    item: "",
    marcaModelo: "",
    elementosEspeciales: "",
    proveedor: "",
    cantidad: 1,
    descripcion: "",
    total: 0,
    observaciones: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setF((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...f };

    // Parsear fecha a medianoche local
    const [year, month, day] = data.fecha.split("-").map(Number);
    const dtLocal = new Date(year, month - 1, day);
    data.fecha = Timestamp.fromDate(dtLocal);

    try {
      await createPresupuesto(data);
      alert(t("presupuesto_guardado"));
      onBack();
    } catch (error) {
      alert(t("error_guardar_presupuesto"));
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit}>
      <h2>{t("formulario_presupuesto")}</h2>

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

      {/* Datos del cliente */}
      <div className={styles.clienteSection}>
        <h3>Datos del cliente</h3>
        
        <div className={styles.field}>
          <label htmlFor="cliente">{t("cliente")}</label>
          <input
            type="text"
            id="cliente"
            name="cliente"
            value={f.cliente}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="telefono">{t("telefono")}</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={f.telefono}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">{t("email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={f.email}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Producto */}
      <div className={styles.productoSection}>
        <h3>Detalles del producto</h3>

        <div className={styles.field}>
          <label htmlFor="item">{t("items")}</label>
          <select
            id="item"
            name="item"
            value={f.item}
            onChange={handleChange}
            required
          >
            <option value="">{t("seleccionar")}</option>
            {items.map((item) => (
              <option key={item} value={item}>
                {t(item.toLowerCase())}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="marcaModelo">{t("marca_modelo")}</label>
          <select
            id="marcaModelo"
            name="marcaModelo"
            value={f.marcaModelo}
            onChange={handleChange}
          >
            <option value="">{t("seleccionar")}</option>
            {marcasModelos.map((marca) => (
              <option key={marca} value={marca}>
                {t(marca.toLowerCase())}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="elementosEspeciales">{t("elementos_especiales")}</label>
          <select
            id="elementosEspeciales"
            name="elementosEspeciales"
            value={f.elementosEspeciales}
            onChange={handleChange}
          >
            <option value="">{t("seleccionar")}</option>
            {elementosEspeciales.map((elemento) => (
              <option key={elemento} value={elemento}>
                {t(elemento.toLowerCase())}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="proveedor">{t("proveedor")}</label>
          <select
            id="proveedor"
            name="proveedor"
            value={f.proveedor}
            onChange={handleChange}
          >
            <option value="">{t("seleccionar")}</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor} value={proveedor}>
                {t(proveedor.toLowerCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cantidad y precio */}
      <div className={styles.fieldRow}>
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
      </div>

      {/* Descripción */}
      <div className={styles.field}>
        <label htmlFor="descripcion">{t("descripcion")}</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={f.descripcion}
          onChange={handleChange}
          rows="3"
        />
      </div>

      {/* Observaciones */}
      <div className={styles.field}>
        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          name="observaciones"
          value={f.observaciones}
          onChange={handleChange}
          rows="2"
        />
      </div>

      {/* Botones */}
      <div className={styles.buttons}>
        <button type="submit" className={styles.guardar}>
          {t("guardar")}
        </button>
        <button type="button" className={styles.volver} onClick={onBack}>
          {t("volver")}
        </button>
      </div>
    </form>
  );
}