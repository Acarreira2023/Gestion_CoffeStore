// src/components/charts/PieChart.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import styles from "./Charts.module.css";

/**
 * Componente de gráfico de torta para datos categorizados
 */
export default function PieChartComponent({ title, data }) {
  const COLORES = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A28EFF",
    "#FF6E6E"
  ];

  return (
    <div className={styles.pieChart} role="region" aria-label={title}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={65}
            label={({ value }) => `$${value.toLocaleString("es-AR")}`}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORES[idx % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip formatter={value => `$${value.toLocaleString("es-AR")}`} />
           <Legend layout="vertical" align="right" /> 
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}