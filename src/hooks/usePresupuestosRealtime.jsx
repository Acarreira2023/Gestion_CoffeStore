/* src/hooks/usePresupuestosRealtime.jsx
 * Descripción: Hook para obtener presupuestos en tiempo real desde Firestore.
 * Permite leer los presupuestos ordenados por fecha de forma reactiva.
 */
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseService";

/**
 * Solo lectura en tiempo real de "presupuestos"
 */
export function usePresupuestosRealtime() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "presupuestos"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(
      q,
      snap => {
        setPresupuestos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error("Realtime error (presupuestos):", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { presupuestos, loading, error };
}