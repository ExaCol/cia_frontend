/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Page
*/

import React from "react";
import { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Registrarse - ST",
  description: "Página de registro de SmartTraffic",
};

function Register() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <RegisterForm role = "Cliente"/>
    </div>
  );
}

export default Register;
