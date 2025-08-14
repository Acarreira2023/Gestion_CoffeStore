// src/config/firebaseService.jsx

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  writeBatch,
  Timestamp,
  doc,
  deleteDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "../config/firebaseConfig";

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

/**
 * Normaliza `fecha` a Firestore Timestamp.
 */
const normalizeFecha = (fecha) => {
  if (!fecha) return fecha;
  if (fecha instanceof Timestamp) return fecha;
  if (fecha instanceof Date) return Timestamp.fromDate(fecha);
  const dt = new Date(fecha);
  return !isNaN(dt) ? Timestamp.fromDate(dt) : fecha;
};

// ---------- INGRESOS ----------

export const guardarIngreso = async (data) => {
  try {
    const payload = { ...data, fecha: normalizeFecha(data.fecha) };
    await addDoc(collection(db, "ingresos"), payload);
    return { success: true };
  } catch (error) {
    console.error("Error al guardar ingreso:", error);
    return { success: false, error };
  }
};

export const obtenerIngresos = async () => {
  const snap = await getDocs(collection(db, "ingresos"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subirIngresos = async (datos) => {
  const batch = writeBatch(db);
  const col = collection(db, "ingresos");
  datos.forEach(item => {
    const ref = doc(col);
    batch.set(ref, {
      ...item,
      fecha: normalizeFecha(item.fecha)
    });
  });
  await batch.commit();
};

export const borrarIngreso = async (id) => {
  try {
    await deleteDoc(doc(db, "ingresos", id));
    return { success: true };
  } catch (error) {
    console.error("Error al borrar ingreso:", error);
    return { success: false, error };
  }
};

// ---------- EGRESOS ----------

export const guardarEgreso = async (data) => {
  try {
    const payload = { ...data, fecha: normalizeFecha(data.fecha) };
    await addDoc(collection(db, "egresos"), payload);
    return { success: true };
  } catch (error) {
    console.error("Error al guardar egreso:", error);
    return { success: false, error };
  }
};

export const obtenerEgresos = async () => {
  const snap = await getDocs(collection(db, "egresos"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subirEgresos = async (datos) => {
  const batch = writeBatch(db);
  const col = collection(db, "egresos");
  datos.forEach(item => {
    const ref = doc(col);
    batch.set(ref, {
      ...item,
      fecha: normalizeFecha(item.fecha)
    });
  });
  await batch.commit();
};

export const borrarEgreso = async (id) => {
  try {
    await deleteDoc(doc(db, "egresos", id));
    return { success: true };
  } catch (error) {
    console.error("Error al borrar egreso:", error);
    return { success: false, error };
  }
};

// ---------- PRESUPUESTOS ----------

export const guardarPresupuesto = async (data) => {
  try {
    const payload = { ...data, fecha: normalizeFecha(data.fecha) };
    await addDoc(collection(db, "presupuestos"), payload);
    return { success: true };
  } catch (error) {
    console.error("Error al guardar presupuesto:", error);
    return { success: false, error };
  }
};

export const obtenerPresupuestos = async () => {
  const snap = await getDocs(collection(db, "presupuestos"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subirPresupuestos = async (datos) => {
  const batch = writeBatch(db);
  const col = collection(db, "presupuestos");
  datos.forEach(item => {
    const ref = doc(col);
    batch.set(ref, {
      ...item,
      fecha: normalizeFecha(item.fecha)
    });
  });
  await batch.commit();
};

export const borrarPresupuesto = async (id) => {
  try {
    await deleteDoc(doc(db, "presupuestos", id));
    return { success: true };
  } catch (error) {
    console.error("Error al borrar presupuesto:", error);
    return { success: false, error };
  }
};

export { app, db, auth };