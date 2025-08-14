// src/components/charts/BarComparativo.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import styles from "./Charts.module.css";

/**
 * Gráfico de barras comparativo de ingresos y egresos
 */
export default function BarComparativo({ data, xTickFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} className={styles.chart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickFormatter={xTickFormatter} // formato eje X
        />
        <YAxis />
        <Tooltip
          labelFormatter={xTickFormatter} // formato en el tooltip
          formatter={value => new Intl.NumberFormat().format(value)}
        />
        <Legend />
        <Bar dataKey="ingresos" fill="#82ca9d" name="Ingresos" />
        <Bar dataKey="egresos" fill="#8884d8" name="Egresos" />
      </BarChart>
    </ResponsiveContainer>
  );
}