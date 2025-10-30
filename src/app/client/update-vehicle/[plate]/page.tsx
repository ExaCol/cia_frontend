"use client";
import React from "react";
import { useParams } from "next/navigation";

function UpdateVehicle() {
  const { plate } = useParams<{ plate: string }>();
  const decoded = decodeURIComponent(plate);

  return <div>UpdateVehicle {decoded}</div>;
}

export default UpdateVehicle;
