/*
developed by Tomás Vera & Luis Romero
Version 1.0
New Password Page
*/

"use client";
import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
const url = process.env.NEXT_PUBLIC_URL;

function NewPassword() {
  const router = useRouter();
  const [enviado, setEnviado] = React.useState(false);
  const [tokenEnviado, setTokenEnviado] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    setEmail(email);
    axios
      .get(url + "/token/obtener-token/" + encodeURIComponent(email))
      .then((response) => {
        if (response.status === 200) {
          alert("Correo enviado");
          setEnviado(true);
        }
      })
      .catch((err) => {
        console.error("Error al enviar correo:", err);
        if (err.response?.status === 400) {
          alert("No se encontró un usuario con ese correo.");
          return;
        } else {
          alert("Error al enviar correo: " + err.response.data);
        }
      });
  };

  const handleTokenSent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("token") || "").trim();
    axios.get(url + "/token/verify-token/" + encodeURIComponent(token) + "/" + email)
      .then((response) => {
        if (response.status === 200) {
            alert("Token verificado");
            setTokenEnviado(true);
        }
        }).catch((err) => {
            console.error("Error al verificar token:", err);
            alert("Error al verificar token: " + err.response.data);
        });
  };

  const handleNewPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");
    if (password !== password2) {
        alert("Las contraseñas no coinciden");
        return;
    }
    axios.patch(url + "/usr/change-password", {
        password, email
    }).then((response) => {
        if (response.status === 200) {
            alert("Contraseña reestablecida");
            router.push("/login");
        }
    }).catch((err) => {
        console.error("Error al reestablecer contraseña:", err);
        alert("Error al reestablecer contraseña: " + err.response.data);
    });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
        flexDirection: "column",
        alignItems: "center",
        alignContent: "center",
      }}
    >
      <h1>Reestablecimiento de contraseña</h1>
      <p>
        Ingresa tu correo electrónico y te enviaremos un código único para
        reestablecer tu contraseña.
      </p>
      {!enviado && (<form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 400,
        }}
      >
        <label htmlFor="email">Correo electrónico:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Ej: tomas@correo.com"
          required
        />
        <button type="submit" style={{ marginTop: 10 }}>
          Enviar Correo
        </button>
      </form>)}
      {(enviado && !tokenEnviado) && (
          <form
            onSubmit={handleTokenSent}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 400,
            }}
          >
            <input
              type="text"
              id="token"
              name="token"
              placeholder="Ej: 123456"
              required
            />
            <button style={{ marginTop: 10 }}>
              Verificar Token
            </button>
          </form>
      )}

      {tokenEnviado && (
        <form
          onSubmit={handleNewPassword}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 400,
          }}
        >
          <label htmlFor="password">Nueva contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Mínimo 8 caracteres, mayúsculas, minúsculas y números"
            required
          />
          <input
            type="password"
            id="password2"
            name="password2"
            placeholder="Repite la nueva contraseña"
            required
          />
          <button type="submit" style={{ marginTop: 10 }}>
            Cambiar Contraseña
          </button>
        </form>
      )}
    </div>
  );
}

export default NewPassword;
