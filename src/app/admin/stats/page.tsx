/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Stats Page
*/

import React from 'react'
import { Metadata } from 'next'
import Estadisticas from '@/components/Stats';

export const metadata: Metadata = {
  title: "Estadísticas - ST",
  description: "Estadísticas de la página web de SmartTraffic",
};


function Stats() {
  return (
    <div>
        <h1>Estadísticas de usuarios</h1>
        < Estadisticas />
    </div>
  )
}

export default Stats