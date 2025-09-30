/*
Developed by Tomás Vera & Luis Romero
Version 1.1
Login Page
*/

import React from "react";
import { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión - ST",
  description: "Página de inicio de sesión de SmartTraffic",
};

export default function LogIn() {
  

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
     <LoginForm />
    </div>
  );
}
