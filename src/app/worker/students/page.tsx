import React from 'react'
import Link from 'next/link'

function Students() {
  return (
    <div>
      <h1>Estudiantes</h1>
      <Link href="/worker/register"><button>Registrar Usuario</button></Link>
    </div>
  )
}

export default Students