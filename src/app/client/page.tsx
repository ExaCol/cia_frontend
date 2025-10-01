/*
Developed by Tomás Vera & Luis Romero
Version 1.0
Usuario Home Page
*/

import "@/styles/globals.css";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h2 style = {{textAlign : "center"}}>Ésta es la página de Cliente de SmartTraffic</h2>
      <div>
        <Link href="/client/services">
          <button>Mis servicios</button>
        </Link>

        <Link href="/client/services/new">
          <button>Solicitar servicio</button>
        </Link>
      </div>
    </div>
    
  );
}