/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Partner Page
*/

"use client";

import React from "react";
import RegisterPartner from "@/components/RegisterPartner";

export default function RegisterPartnerPage() {
  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Nuevo Partner</h1>
      <RegisterPartner />
    </div>
  );
}
