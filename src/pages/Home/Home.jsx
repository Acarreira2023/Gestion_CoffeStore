// src/pages/Home/Home.jsx

import React from "react";
import { useIdioma } from "../../context/IdiomaContext";
import MenuBar from "../../components/Menu/MenuBar";
import ResumenEconomico from "../../components/ResumenEconomico/ResumenEconomico";
import styles from "./Home.module.css";

export default function Home() {
  const { t } = useIdioma();

  return (
    <div className={styles.home}>
      <MenuBar />
      <header className={styles.header}>
        <h1>Gestión Coffe Store</h1>
        <p>{t("bienvenido_panel") || "Panel financiero y seguimiento de ingresos y egresos"}</p>
      </header>
      <ResumenEconomico />
    </div>
  );
}
