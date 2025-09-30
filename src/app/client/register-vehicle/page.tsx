/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Register Vehicle Page
*/

"use client";

import React from "react";
import RegisterVehicle from "@/components/RegisterVehicle";


function VehicleRegisterPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <RegisterVehicle />
    </div>
  );
}

export default VehicleRegisterPage;
