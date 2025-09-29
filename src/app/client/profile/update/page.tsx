/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Update Page
*/

import React from "react";
import { Metadata } from "next";
import UpdateForm from "@/components/UpdateForm";

export const metadata: Metadata = {
  title: "Actualizar - ST",
  description: "Página de registro de SmartTraffic",
};

function Update() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <UpdateForm />
    </div>
  );
}

export default Update;
