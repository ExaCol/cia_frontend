import React from "react";
import { Metadata } from "next";
import Courses from "@/components/Courses";
import s from "./AdminCoursesPage.module.css";

export const metadata: Metadata = {
  title: "Cursos - ST",
  description: "Gestión de cursos de conducción y comparendos",
};

function CoursesPage() {
  return (
    <div className={s.page}>
      <div className={s.headerRow}>
        <h1 className={s.title}>Cursos de conducción</h1>
        <p className={s.subtitle}>
          Administra la oferta de cursos, cupos y tipos de comparendos desde este panel.
        </p>
      </div>

      <section className={s.card}>
        <div className={s.coursesWrapper}>
          <Courses />
        </div>
      </section>
    </div>
  );
}

export default CoursesPage;
