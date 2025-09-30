import Image from 'next/image';
import s from './Footer.module.css';


export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className="container">
        <div className={s.brand}>
        <a href="https://exacol.github.io/ExaPages/" target="_blank" rel="noopener noreferrer" className={s.logoLink} arial-label="Exa">
          <Image src="/ExaBlack.png" alt="Exa" width={60} height={28}/>
        </a>
        </div>
        <div className={s.bottom}>
          <small>© {year} Exa. Todos los derechos reservados.</small>
        </div>
      </div>
    </footer>
  );
}
