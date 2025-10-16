import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import Courses from "@/components/Courses";

export const metadata: Metadata = {
  title: "Cursos - ST",
  description: "Gestión de cursos de conducción y comparendos",
};



function CoursesPage() {
  return (
    <div>
      <h1>Cursos de Conducción</h1>
      <Courses />
      <Link href="/admin/courses/new">
        <button style={{ marginTop: "20px" }}>Agregar Curso</button>
        </Link>
    </div>
  );
}

export default CoursesPage;
