/* src/hooks/usePresupuestosCrud.jsx
 * Descripción: Hook para CRUD de presupuestos.
 * Permite crear, editar, eliminar y convertir presupuestos a ventas.
 */
import { useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { db } from "../services/firebaseService";
import { toast } from "react-hot-toast";

/**
 * usePresupuestosCrud
 * — Exposición de las funciones create/edit/delete/convert para la colección "presupuestos"
 * — No mantiene estado de lectura; confía en usePresupuestosRealtime para actualizar UI
 */
export function usePresupuestosCrud() {
  const createPresupuesto = useCallback(async (data) => {
    try {
      await addDoc(collection(db, "presupuestos"), {
        ...data,
        estado: "PENDIENTE",
        fechaCreacion: Timestamp.now()
      });
      toast.success("Presupuesto agregado");
    } catch (err) {
      console.error("Create error (presupuestos):", err);
      toast.error("Error al agregar presupuesto");
    }
  }, []);

  const editPresupuesto = useCallback(async (id, updates) => {
    try {
      const ref = doc(db, "presupuestos", id);
      await updateDoc(ref, updates);
      toast.success("Presupuesto actualizado");
    } catch (err) {
      console.error("Update error (presupuestos):", err);
      toast.error("Error al actualizar presupuesto");
    }
  }, []);

  const removePresupuesto = useCallback(async (id) => {
    try {
      const ref = doc(db, "presupuestos", id);
      await deleteDoc(ref);
      toast.success("Presupuesto eliminado");
    } catch (err) {
      console.error("Delete error (presupuestos):", err);
      toast.error("Error al eliminar presupuesto");
    }
  }, []);

  const convertirAVenta = useCallback(async (presupuesto) => {
    try {
      // Actualizar estado del presupuesto
      const presupuestoRef = doc(db, "presupuestos", presupuesto.id);
      await updateDoc(presupuestoRef, {
        estado: "VENDIDO",
        fechaVenta: Timestamp.now()
      });

      // Crear ingreso correspondiente
      await addDoc(collection(db, "ingresos"), {
        fecha: Timestamp.now(),
        tipo: "VENTA_PRODUCTO",
        categoria: "VENTA",
        item: presupuesto.item,
        marcaModelo: presupuesto.marcaModelo,
        elementosEspeciales: presupuesto.elementosEspeciales,
        cliente: presupuesto.cliente,
        descripcion: `Venta de presupuesto #${presupuesto.id}`,
        cantidad: presupuesto.cantidad,
        total: presupuesto.total,
        presupuestoId: presupuesto.id
      });

      toast.success("Presupuesto convertido a venta");
    } catch (err) {
      console.error("Convert error (presupuestos):", err);
      toast.error("Error al convertir presupuesto");
    }
  }, []);

  return { createPresupuesto, editPresupuesto, removePresupuesto, convertirAVenta };
}