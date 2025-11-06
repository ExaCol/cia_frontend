import React from "react";

import UpdateVehicleForm from "@/components/UpdateVehicleForm";

function UpdateVehicle() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "10px",
        marginBottom: "20px",
      }}
    >
      <UpdateVehicleForm />
    </div>
  );
}

export default UpdateVehicle;
