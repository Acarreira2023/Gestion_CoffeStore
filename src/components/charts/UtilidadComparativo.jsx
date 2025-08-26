// src/components/charts/UtilidadComparativo.jsx

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useIdioma } from "../../context/IdiomaContext";
import styles from "./Charts.module.css";

export default function UtilidadComparativo({ data }) {
  const { t } = useIdioma();

  return (
    <div className={styles.chartWrapper} role="region" aria-label={t("utilidad_comparativo")}>
      <h3 className={styles.chartTitle}>{t("utilidad_comparativo")}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={val => `$${val.toLocaleString()}`} />
          <Legend />
          <Bar
            dataKey="utilidad"
            name={t("utilidad")}
            fill="#82ca9d"
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}