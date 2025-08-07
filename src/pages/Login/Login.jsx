// src/pages/Login/Login.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useIdioma } from "../../context/IdiomaContext";
import fondoImg from "../../assets/imagenes/coffestore.jpg";
import styles from "./Login.module.css";

export default function Login() {
  const { login } = useAuth();
  const { t }     = useIdioma();
  const nav       = useNavigate();

  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [remember, setRem]    = useState(false);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
    if (saved) { setEmail(saved); setRem(true); }
  }, []);

  const onSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      remember
        ? localStorage.setItem("savedEmail", email)
        : localStorage.removeItem("savedEmail");
      nav("/graficos1");
    } catch (err) {
      setError(err.message || t("error_login"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.container}
      style={{ backgroundImage: `url(${fondoImg})` }}
    >
      <form className={styles.form} onSubmit={onSubmit}>
        <h2 className={styles.title}>{t("Bienvenido")}</h2>
        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          {t("Usuario")}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          {t("Contraseña")}
          <input
            type="password"
            value={password}
            onChange={e => setPass(e.target.value)}
            required
            className={styles.input}
          />
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => {
              setRem(e.target.checked);
              if (!e.target.checked) localStorage.removeItem("savedEmail");
            }}
          />
          {t("Recordar email")}
        </label>

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? `${t("Ingresar")}…` : t("Ingresar")}
        </button>
      </form>
    </div>
  );
}