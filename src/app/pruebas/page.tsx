"use client";

import Button from "@/components/ui/Button";

export default function UIPage() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <h2>Botones por color</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="primary">primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="third">third</Button>
        <Button variant="fourth">fourth</Button>
        <Button variant="holder">holder</Button>
        <Button variant="black">black</Button>
        <Button variant="white">white</Button>
        <Button variant="red">red</Button>
        <Button variant="redDark">redDark</Button>
      </div>
    </div>
  );
}
