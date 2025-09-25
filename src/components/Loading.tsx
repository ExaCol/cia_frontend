/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Loading Component
*/

'use client';
import s from './Loading.module.css';

export default function Loading() {
  return (
    <div className={s.overlay} role="status" aria-live="polite">
      <div className={s.wrapper}>
        <div className={s.pole} />
        <div className={s.body}>
          <span className={`${s.light} ${s.red}`} />
          <span className={`${s.light} ${s.yellow}`} />
          <span className={`${s.light} ${s.green}`} />
        </div>
      </div>
      <span className={s.label}>Cargando…</span>
    </div>
  );
}
