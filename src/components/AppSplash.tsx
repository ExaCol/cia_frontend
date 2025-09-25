/*
Developed by Tomás Vera & Luis Romero
Version 1.0
App Splash Component
*/

'use client';
import { useEffect, useState } from 'react';
import LoadingTrafficLight from './Loading';

export default function AppSplash({ minMs = 600 }: { minMs?: number }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHide(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);
  if (hide) return null;
  return <LoadingTrafficLight />;
}
