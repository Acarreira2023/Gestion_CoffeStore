// src/pages/Ingresar/Ingresar.jsx
import React, { useState } from "react";
import { useIdioma } from "../../context/IdiomaContext";
import IngresoForm   from "./IngresoForm";
import EgresoForm    from "./EgresoForm";
import PresupuestoForm from "./PresupuestoForm";
import FileImporter  from "./FileImporter";
import styles        from "./Ingresar.module.css";

export default function Ingresar() {
  const { t } = useIdioma();
  const [step, setStep] = useState(1);
  const [modo, setModo] = useState(null);   // "manual" | "import"
  const [tipo, setTipo] = useState(null);   // "ingreso" | "egreso" | "presupuesto"

  const reset = () => {
    setStep(1);
    setModo(null);
    setTipo(null);
  };

  // Paso 1: elegir modo (Manual vs Importar)
  if (step === 1) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>{t("ingresar_datos")}</h1>
        <div className={styles.cards}>
          <div
            className={styles.card}
            onClick={() => { setModo("manual"); setStep(2); }}
          >
            <span className={styles.icon}>📝</span>
            <h3>{t("ingreso_manual")}</h3>
          </div>
          <div
            className={styles.card}
            onClick={() => { setModo("import"); setStep(2); }}
          >
            <span className={styles.icon}>📂</span>
            <h3>{t("importar_archivo")}</h3>
          </div>
        </div>
      </div>
    );
  }

  // Paso 2: elegir tipo (Ingreso vs Egreso)
  if (step === 2) {
    const manual = modo === "manual";
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          {manual ? t("ingreso_manual") : t("importar_archivo")}
        </h1>
        <div className={styles.cards}>
          <div
            className={styles.card}
            onClick={() => { setTipo("ingreso"); setStep(3); }}
          >
            <span className={styles.icon}>📝</span>
            <h3>
              {manual ? t("formulario_ingreso") : t("archivo_ingreso")}
            </h3>
          </div>
          <div
            className={styles.card}
            onClick={() => { setTipo("egreso"); setStep(3); }}
          >
            <span className={styles.icon}>📝</span>
            <h3>
              {manual ? t("formulario_egreso") : t("archivo_egreso")}
            </h3>
          </div>
          {manual && (
            <div
              className={styles.card}
              onClick={() => { setTipo("presupuesto"); setStep(3); }}
            >
              <span className={styles.icon}>📋</span>
              <h3>{t("formulario_presupuesto")}</h3>
            </div>
          )}
        </div>
        <button className={styles.back} onClick={reset}>
          {t("volver")}
        </button>
      </div>
    );
  }

  // Paso 3: renderizar el componente correspondiente
  return (
    <div className={styles.container}>
      {modo === "manual" ? (
        tipo === "ingreso" ? (
          <IngresoForm onBack={() => setStep(2)} />
        ) : tipo === "presupuesto" ? (
          <PresupuestoForm onBack={() => setStep(2)} />
        ) : (
          <EgresoForm  onBack={() => setStep(2)} />
        )
      ) : (
        <FileImporter tipo={tipo} onBack={() => setStep(2)} />
      )}
    </div>
  );
}