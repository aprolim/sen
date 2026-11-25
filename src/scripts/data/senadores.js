// data/senadores.js - VERSIÓN FUSIONADA FINAL CON PROYECTOS DE LEY (71 ELEMENTOS)
// ✅ 36 TITULARES (id: 1-36) + 35 SUPLENTES (id: 37-71)
// ✅ CONTIENE TODOS LOS DATOS DEL ARCHIVO AGRUPADO + PROYECTOS DE LEY DEL EXCEL
// ✅ COMPATIBLE CON SenateChamber.vue, useSenadores.js, y todas las páginas

const generarSlug = (nombre) => {
  if (!nombre) return ''
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export const senadores = [
  // ==========================================
  // TITULARES (id: 1-36) - ORDENADOS POR SEATNUMBER
  // ==========================================

  // ASIENTO 1 - Wilder Véliz Armas (Cochabamba)
  {
    id: 1,
    tipo: 'titular',
    seatNumber: 1,
    name: "Wilder Véliz Armas",
    slug: generarSlug("Wilder Véliz Armas"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Cochabamba",
    comision: "Comité de Justicia Plural y Consejo de la Magistratura.",
    cargo: "Secretario de Comite",
    foto: "/senadores/titulares/g1/WILDER VELIZ ARMAS.png",
    fechaNacimiento: "3 de octubre, 1985",
    nacidoEn: "Cochabamba - Chapare - Palca",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 37,
    proyectosLey: {
      cantidad: 10,
      lista: [
        "1. DE INTERPELACIONES Y CENSURA A MINISTRAS Y MINISTROS DEL ESTADO PLURINACIONAL DE BOLIVIA",
        "2. DE RESPONSABILIDAD ELECTORAL ANTE EL INCUMPLIMIENTO DE PROGRAMAS DE GOBIERNO Y COMPROMISOS ELECTORALES",
        "3. DE MODIFICACIÓN AL RÉGIMEN DEL SEGURO OBLIGATORIO CONTRA ACCIDENTES DE TRÁNSITO"
      ]
    }
  },

  // ASIENTO 2 - Judith Rosario García Coca (Cochabamba)
  {
    id: 2,
    tipo: 'titular',
    seatNumber: 2,
    name: "Judith Rosario García Coca",
    slug: generarSlug("Judith Rosario García Coca"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Cochabamba",
    comision: "Comisión de Seguridad del Estado",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g1/JUDITH ROSARIO GARCIA COCA.png",
    fechaNacimiento: "4 de noviembre, 1967",
    nacidoEn: "Potosí - Rafael Bustillo - Siglo XX",
    ocupacion: "Licenciada",
    facebook: "https://www.facebook.com/share/1HVRLQpQT2/",
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: "https://www.tiktok.com/@rosario030814?_r=1&_t=ZS-98rNU3gInVV",
    suplenteId: 38,
    proyectosLey: {
      cantidad: 10,
      lista: [
        "1. PROYECTO DE LEY DE SEGURIDAD Y DEFENSA INTEGRAL DEL ESTADO",
        "2. PROYECTO DE LEY DEL SISTEMA DE INTELIGENCIA DEL ESTADO PLURINACIONAL",
        "3. LEY MARCO DEL SISTEMA NACIONAL DE INFORMACIÓN GEOESPACIAL Y DE LA CARTOGRAFÍA OFICIAL DEL ESTADO"
      ]
    }
  },

  // ASIENTO 3 - Claudia Mallón Vargas (Cochabamba)
  {
    id: 3,
    tipo: 'titular',
    seatNumber: 3,
    name: "Claudia Mallón Vargas",
    slug: generarSlug("Claudia Mallón Vargas"),
    party: "Autonomía para Bolivia Súmate",
    partyShort: "APB",
    partyColor: "#611789",
    department: "Cochabamba",
    comision: "Comité de Vivienda, Regimen Laboral, Seguridad Industrial y Seguridad Social",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g1/CLAUDIA MALLON VARGAS.png",
    fechaNacimiento: "19 de diciembre, 1979",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 39,
    proyectosLey: {
      cantidad: 17,
      lista: [
        "1. LEY JOKY DE PROTECCIÓN INTEGRAL Y BIENESTAR ANIMAL",
        "2. PROYECTO DE LEY DE ECONOMÍA CREATIVA E INDUSTRIAS CULTURALES CREATIVAS",
        "3. LEY DE LIBERTAD DE INVERSIONES Y SEGURIDAD JURÍDICA"
      ]
    }
  },

  // ASIENTO 4 - Wanda Ximena Medrano Hervas (Cochabamba)
  {
    id: 4,
    tipo: 'titular',
    seatNumber: 4,
    name: "Wanda Ximena Medrano Hervas",
    slug: generarSlug("Wanda Ximena Medrano Hervas"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Cochabamba",
    comision: "Comité de Relaciones Económicas Internacionales",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g1/WANDA XIMENA MEDRANO HERVAS.png",
    fechaNacimiento: "14 de noviembre, 1975",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: "Abogada",
    facebook: "https://www.facebook.com/WandaMedranoOficial",
    twitter: null,
    instagram: "https://www.instagram.com/wandamedrano.oficial/",
    youtube: null,
    tiktok: "https://www.tiktok.com/@wandamedranosenadora",
    suplenteId: 40,
    proyectosLey: {
      cantidad: 7,
      lista: [
        "1. PROYECTO DE LEY INTEGRAL PARA LA SEGURIDAD Y DEFENSA NACIONAL",
        "2. PROYECTO DE LEY DE DEVOLUCIÓN TOTAL Y VOLUNTARIA DE APORTES AL SISTEMA INTEGRAL DE PENSIONES",
        "3. DE PROTECCIÓN INTEGRAL DE INTERNOS ROTATORIOS Y MÉDICOS RESIDENTES DEL ESTADO PLURINACIONAL DE BOLIVIA"
      ]
    }
  },

  // ASIENTO 5 - José Manuel Ormachea Mendieta (La Paz)
  {
    id: 5,
    tipo: 'titular',
    seatNumber: 5,
    name: "José Manuel Ormachea Mendieta",
    slug: generarSlug("José Manuel Ormachea Mendieta"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "La Paz",
    comision: "Comisión de Naciones y Pueblos Indígena Originario Campesinos, Culturas e Interculturalidad",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g1/JOSE MANUEL ORMACHEA MENDIETA.png",
    fechaNacimiento: "3 de noviembre, 1988",
    nacidoEn: "La Paz - Murillo - Nuestra Señora de La Paz",
    ocupacion: "Lic. en Ciencias Políticas",
    facebook: "https://www.facebook.com/share/1C98FFBmYw/",
    twitter: "https://x.com/JoseMOrmachea",
    instagram: "https://www.instagram.com/josemormachea?igsh=NXJwdGFvMWx3YzRz",
    youtube: null,
    tiktok: "https://www.tiktok.com/@josemormachea?_r=1&_t=ZS-98sep4W50rc",
    suplenteId: 41,
    proyectosLey: {
      cantidad: 4,
      lista: [
        "1. QUE DECLARA AL PATO ZAMBULLIDOR DEL LAGO TITICACA PATRIMONIO CULTURAL DEL ESTADO PLURINACIONAL DE BOLIVIA",
        "2. DE ALIVIO TRIBUTARIO, REACTIVACIÓN Y FORMALIZACIÓN PARA ECONOMÍA NARANJA",
        "3. DEL EJERCICIO PROFESIONAL DEL POLITÓLOGO"
      ]
    }
  },

  // ASIENTO 6 - Carmen Soledad Chapeton Tancara (La Paz)
  {
    id: 6,
    tipo: 'titular',
    seatNumber: 6,
    name: "Carmen Soledad Chapeton Tancara",
    slug: generarSlug("Carmen Soledad Chapeton Tancara"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "La Paz",
    comision: "Directiva Legislatura 2025-2026",
    cargo: "Primera Vicepresidencia",
    foto: "/senadores/titulares/g1/CARMEN SOLEDAD CHAPETÓN TANCARA.png",
    fechaNacimiento: "25 de octubre, 1980",
    nacidoEn: "La Paz - Murillo - Nuestra Señora de La Paz",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 42,
    proyectosLey: {
      cantidad: 10,
      lista: [
        "1. DE INCREMENTO DE LA RENTA UNIVERSAL DE VEJEZ (RENTA DIGNIDAD)",
        "2. ZONA ECONÓMICA ESPECIAL DE EL ALTO \"ZEE-EA\"",
        "3. MI SALUD MENTAL"
      ]
    }
  },

  // ASIENTO 7 - Nicanor Gonzalo Cochi Condorí (La Paz)
  {
    id: 7,
    tipo: 'titular',
    seatNumber: 7,
    name: "Nicanor Gonzalo Cochi Condorí",
    slug: generarSlug("Nicanor Gonzalo Cochi Condorí"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "La Paz",
    comision: "Comisión de Política Internacional y Protección al Migrante",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g1/NICANOR GONZALO COCHI CONDORI.png",
    fechaNacimiento: "10 de enero, 1980",
    nacidoEn: "La Paz - Pacajes - Condo",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 43,
    proyectosLey: {
      cantidad: 6,
      lista: [
        "1. ABROGACIÓN DEL PRINCIPIO DE INFORMALIDAD DE LA LEY 348",
        "2. LEY DE CONSOLIDACIÓN DE CREACIÓN Y FINANCIAMIENTO DE LAS TRES (3) UNIVERSIDADES INDÍGENAS BOLIVIANAS, COMUNITARIAS, INTERCULTURALES, PRODUCTIVAS-UNIBOL",
        "3. QUE ELEVA A RANGO DE LEY EL DECRETO SUPREMO N° 5600 Y FORTALECE LA TRANSPARENCIA, PUBLICIDAD Y CONTROL DE LAS CONTRATACIONES DIRECTAS DEL ESTADO"
      ]
    }
  },

  // ASIENTO 8 - Tomasa Yarhui Jacome (Chuquisaca)
  {
    id: 8,
    tipo: 'titular',
    seatNumber: 8,
    name: "Tomasa Yarhui Jacome",
    slug: generarSlug("Tomasa Yarhui Jacome"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Chuquisaca",
    comision: "Comité de Sistema Electoral, Derechos Humanos y Equidad Social",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g1/TOMASA YARHUI JACOME.png",
    fechaNacimiento: "7 de marzo, 1968",
    nacidoEn: "Chuquisaca - Oropeza - Manca Jallpa",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 44,
    proyectosLey: {
      cantidad: 9,
      lista: [
        "1. LEY DE CIELOS ABIERTOS PARA LA LIBRE COMPETENCIA AÉREA EN BOLIVIA",
        "2. LEY DE ABROGACIÓN DEL PAQUETE DE LEYES INCENDIARIAS",
        "3. LEY DE PROMOCIÓN ECONÓMICA Y DESARROLLO PRODUCTIVO DE LA CIUDAD DE SUCRE, CAPITAL DEL ESTADO PLUINACIONAL DE BOLIVIA"
      ]
    }
  },

  // ASIENTO 9 - Abdon Porcel Arancibia (Chuquisaca)
  {
    id: 9,
    tipo: 'titular',
    seatNumber: 9,
    name: "Abdon Porcel Arancibia",
    slug: generarSlug("Abdon Porcel Arancibia"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Chuquisaca",
    comision: "Comité de Políticas Financiera, Monetaria, Tributaria y Seguros",
    cargo: "Secretario de Comite",
    foto: "/senadores/titulares/g1/ABDON PORCEL ARANCIBIA.png",
    fechaNacimiento: "17 de octubre, 1962",
    nacidoEn: "Chuquisaca - Oropeza - Sucre",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 45,
    proyectosLey: {
      cantidad: 8,
      lista: [
        "1. PROYECTO DE LEY NACIONAL DE LA BICICLETA",
        "2. DIA NACIONAL DEL MOTOCICLISTA BOLIVIANO",
        "3. DE ABROGACIÓN DE LA LEY N° 767 DE PROMOCIÓN PARA LA INVERSIÓN EN EXPLORACIÓN Y EXPLOTACIÓN HIDROCARBURÍFERA"
      ]
    }
  },

  // ASIENTO 10 - Bertha Cartagena Sánchez (Chuquisaca)
  {
    id: 10,
    tipo: 'titular',
    seatNumber: 10,
    name: "Bertha Cartagena Sánchez",
    slug: generarSlug("Bertha Cartagena Sánchez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Chuquisaca",
    comision: "Comité de Culturas, Interculturalidad y Patrimonio Cultural",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g1/BERTHA CARTAGENA SANCHEZ.png",
    fechaNacimiento: "20 de agosto, 1967",
    nacidoEn: "Chuquisaca - Oropeza - Tasa Pampa",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 46,
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. DECLARAR AL DEPARTAMENTO DE CHUQUISACA PILOTO DE INDUSTRIALIZACIÓN"
      ]
    }
  },

  // ASIENTO 11 - Branko Goran Marinković Jovicevic (Santa Cruz)
  {
    id: 11,
    tipo: 'titular',
    seatNumber: 11,
    name: "Branko Goran Marinković Jovicevic",
    slug: generarSlug("Branko Goran Marinković Jovicevic"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Santa Cruz",
    comision: "Comisión de Tierra y Territorio / Región Amazónica",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g3/BRANKO GORAN MARINKOVIC JOVICEVIC.png",
    fechaNacimiento: "21 de agosto, 1967",
    nacidoEn: "Santa Cruz",
    ocupacion: "Ing. Electromecánico, Economista",
    facebook: "https://www.facebook.com/brankoscz",
    twitter: "https://x.com/BrankoSCZ?lang=es",
    instagram: "https://www.instagram.com/brankoscz/",
    youtube: null,
    tiktok: "https://www.tiktok.com/@brankoscz",
    suplenteId: 47,
    proyectosLey: {
      cantidad: 4,
      lista: [
        "1. LEY QUE AUTORIZA LA TITULACIÓN INDIVIDUAL A MIEMBROS DE PREDIOS DE TITULACIÓN COLECTIVA",
        "2. DE LIBERTAD DE IMPORTACIÓN, ALMACENAJE, TRANSPORTE Y COMERCIALIZACIÓN DE COMBUSTIBLES LÍQUIDOS"
      ]
    }
  },

  // ASIENTO 12 - Kathia Lizbeth Quiroga Fernández (Santa Cruz)
  {
    id: 12,
    tipo: 'titular',
    seatNumber: 12,
    name: "Kathia Lizbeth Quiroga Fernández",
    slug: generarSlug("Kathia Lizbeth Quiroga Fernández"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Santa Cruz",
    comision: "Directiva Legislatura 2025-2026",
    cargo: "Segunda Vicepresidencia",
    foto: "/senadores/titulares/g3/KATHIA LISBETH QUIROGA FERNÁNDEZ.png",
    fechaNacimiento: "18 de mayo, 1967",
    nacidoEn: "Santa Cruz - Sara - Santa Rosa",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 48,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. DE LIBERTAD DE IMPORTACIÓN, ALMACENAJE, TRANSPORTE Y COMERCIALIZACIÓN DE COMBUSTIBLES LÍQUIDOS"
      ]
    }
  },

  // ASIENTO 13 - Rosa Tatiana Áñez Carrasco (Santa Cruz)
  {
    id: 13,
    tipo: 'titular',
    seatNumber: 13,
    name: "Rosa Tatiana Áñez Carrasco",
    slug: generarSlug("Rosa Tatiana Áñez Carrasco"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Santa Cruz",
    comision: "Directiva Legislatura 2025-2026",
    cargo: "Tercera Secretaria",
    foto: "/senadores/titulares/g3/ROSA TATIANA AÑEZ CARRASCO.png",
    fechaNacimiento: "23 de julio, 1979",
    nacidoEn: "Santa Cruz - Andrés Ibañez - Santa Cruz de la Sierra",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 49,
    proyectosLey: {
      cantidad: 7,
      lista: [
        "1. ENAJENACIÓN A TÍTULO GRATUITO DE UNA FRACCIÓN DE TERRENO A FAVOR DE 12 PERSONAS CON ALTO GRADO DE VULNERABILIDAD DEL MUNICIPIO DE COTOCA, CON DESTINO EXCLUSIVO A LA CONSTRUCCIÓN DE VIVIENDAS SOCIALES FINANCIADAS POR LA AGENCIA ESTATAL DE VIVIENDA Y EL FONDO NACIONAL DE SOLIDARIDAD Y EQUIDAD, EN EL MUNICIPIO DE COTOCA",
        "2. ENAJENACIÓN A TÍTULO GRATUITO EN CALIDAD DE DONACIÓN DE UN LOTE DE TERRENO DE PROPIEDAD DEL GOBIERNO AUTÓNOMO MUNICIPAL DE COTOCA A FAVOR DE LA FUNDACIÓN REDIMIDOS CON LA SIGLA \"FUNDARED\" CON USO EXCLUSIVO PARA LA CONSTRUCCIÓN DE LA FASE 2 DE CAPACITACIÓN DEL CENTRO DE FORMACIÓN FUNDARED CENTRO, SEGÚN LEY AUTONÓMICA MUNICIPAL N° 015/2025",
        "3. ENAJENACIÓN A TÍTULO GRATUITO DE DOS LOTES DE TERRENO A FAVOR DE 70 PERSONAS CON ALTO GRADO DE VULNERABILIDAD DEL MUNICIPIO DE COTOCA, CON DESTINO EXCLUSIVO A LA CONSTRUCCIÓN DE VIVIENDAS SOCIALES, FINANCIADAS POR LA AGENCIA ESTATAL DE VIVIENDA Y EL FONDO NACIONAL DE SOLIDARIDAD Y EQUIDAD, EN EL MUNICIPIO DE COTOCA"
      ]
    }
  },

  // ASIENTO 14 - Paola Limbania López Zeballos (Santa Cruz)
  {
    id: 14,
    tipo: 'titular',
    seatNumber: 14,
    name: "Paola Limbania López Zeballos",
    slug: generarSlug("Paola Limbania López Zeballos"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Santa Cruz",
    comision: "Comité de Seguridad del Estado y Lucha Contra el Narcotráfico",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g3/PAOLA LIMBANIA LOPEZ ZEBALLOS.png",
    fechaNacimiento: "24 de junio, 1982",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 50,
    proyectosLey: {
      cantidad: 7,
      lista: [
        "1. LEY DE CREACIÓN Y ESTRUCTURA INSTITUCIONAL DE LA ESCUELA MARÍTIMA",
        "2. LEY GENERAL DEL SISTEMA PORTUARIO NACIONAL",
        "3. LEY DE AERONAVES DEL ESTADO"
      ]
    }
  },

  // ASIENTO 15 - Betty Canaviri Villanueva (Potosí)
  {
    id: 15,
    tipo: 'titular',
    seatNumber: 15,
    name: "Betty Canaviri Villanueva",
    slug: generarSlug("Betty Canaviri Villanueva"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Potosí",
    comision: "Comité de Economía Plural, Desarrollo Productivo, Obras Públicas e Infraestructura",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g2/BETTY CANAVIRI VILLANUEVA.png",
    fechaNacimiento: "17 de abril, 1989",
    nacidoEn: "Potosí - Tomas Frias - Potosí",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 51,
    proyectosLey: {
      cantidad: 5,
      lista: [
        "1. DECLARA CAPITAL DEL TURISMO AL MUNICIPIO DE UYUNI, DEPARTAMENTO DE POTOSÍ DEL ESTADO PLURINACIONAL DE BOLIVIA",
        "2. DECLARATORIA DE LA CHOLA POTOSINA COMO PATRIMONIO CULTURAL, HISTÓRICO E IDENTITARIO DE BOLIVIA",
        "3. DE DECLARATORIA DE LA QUINUA GRANO DE ORO POTOSINO, COMO REFERENTE HISTÓRICO E IDENTITARIO DEL DEPARTAMENTO DE POTOSÍ-BOLIVIA"
      ]
    }
  },

  // ASIENTO 16 - Teresa Alarcón Arana (Potosí) - NO TIENE SUPLENTE
  {
    id: 16,
    tipo: 'titular',
    seatNumber: 16,
    name: "Teresa Alarcón Arana",
    slug: generarSlug("Teresa Alarcón Arana"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Potosí",
    comision: "Comité de Asuntos Exteriores Interpelatorios y Organismos Internacionales",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g2/TERESA ALARCON ARANA.png",
    fechaNacimiento: "5 de noviembre, 1968",
    nacidoEn: "Potosí - Tomas Frias - Potosí",
    ocupacion: "Lic. en Contaduria Publica",
    facebook: "https://www.facebook.com/share/19Q4YxuJUB/",
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: "https://www.tiktok.com/@techi.arana?_r=1&_t=ZS-98rE54uuhvO",
    suplenteId: null,
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. LEY DE MODIFICACIONES AL \"CÓDIGO DE LAS FAMILIAS Y DEL PROCESO FAMILIAR\""
      ]
    }
  },

  // ASIENTO 17 - Marcelino Flores Ordoñez (Potosí)
  {
    id: 17,
    tipo: 'titular',
    seatNumber: 17,
    name: "Marcelino Flores Ordoñez",
    slug: generarSlug("Marcelino Flores Ordoñez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Potosí",
    comision: "Comité de Energía, Hidrocarburos, Minería y Metalurgia",
    cargo: "Secretario de Comite",
    foto: "/senadores/titulares/g2/MARCELINO FLORES ORDOÑEZ.png",
    fechaNacimiento: "16 de enero, 1949",
    nacidoEn: "Potosí - Tomas Frias - Huari Huari",
    ocupacion: "Chofer",
    facebook: "https://www.facebook.com/MarcelinoFloresO/",
    twitter: "https://x.com/SOrdonez4285",
    instagram: "https://www.instagram.com/senador_marcelino_flores/",
    youtube: null,
    tiktok: "https://www.tiktok.com/@marcelino.flores.senador",
    suplenteId: 52,
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. DE SEGURIDAD Y RESILIENCIA ENERGÉTICA"
      ]
    }
  },

  // ASIENTO 18 - Bertha Nurmy Gutiérrez Meneses (Potosí)
  {
    id: 18,
    tipo: 'titular',
    seatNumber: 18,
    name: "Bertha Nurmy Gutiérrez Meneses",
    slug: generarSlug("Bertha Nurmy Gutiérrez Meneses"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Potosí",
    comision: "Comité de Naciones y Pueblos Indígena Originario Campesinos",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g2/BERTHA NURMY GUTIERREZ MENESES.png",
    fechaNacimiento: "2 de abril, 1990",
    nacidoEn: "Potosí - José María Linares - Mulajara",
    ocupacion: "Estudiante",
    facebook: "https://www.facebook.com/profile.php?id=61587337256821",
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: "tiktok.com/@gutierrez.10877",
    suplenteId: 53,
    proyectosLey: {
      cantidad: 5,
      lista: [
        "1. DECLARA PATRIMONIO CULTURAL, MATERIAL, ARQUITECTÓNICO, MONUMENTAL E HISTÓRICO DEL ESTADO PLURINACIONAL DE BOLIVIA AL SANTUARIO DE SURUMI DEL MUNICIPIO DE COLQUECHACA, DEPARTAMENTO DE POTOSÍ",
        "2. SE DECLARA PATRIMONIO CULTURAL, MATERIAL, ARQUITECTÓNICO, MONUMENTAL E HISTÓRICO DEL ESTADO PLURINACIONAL DE BOLIVIA AL TELMPLO DE NUESTRA SEÑORA DEL ROSARIO DE BELÉN, DEL MUNICIPIO DE PUNA, PROVINCIA JOSE MARÍA LINARES, DEPARTAMENTO DE POTOSÍ"
      ]
    }
  },

  // ASIENTO 19 - Erick Nelson Soruco Alpire (Beni)
  {
    id: 19,
    tipo: 'titular',
    seatNumber: 19,
    name: "Erick Nelson Soruco Alpire",
    slug: generarSlug("Erick Nelson Soruco Alpire"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Beni",
    comision: "Comisión de Justicia Plural, Ministerio Público y Defensa del Estado",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g3/ERICK NELSON SORUCO ALPIRE.png",
    fechaNacimiento: "24 de marzo, 1973",
    nacidoEn: "Beni - Vaca Diez - Riberalta",
    ocupacion: "Abogado",
    facebook: "https://www.facebook.com/senadorericksoruco",
    twitter: null,
    instagram: "https://www.instagram.com/senadorericksoruco/",
    youtube: null,
    tiktok: "https://www.tiktok.com/@senador.erick.soruco",
    suplenteId: 54,
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. DE PROTECCIÓN ESTRATÉGICA E INDUSTRIALIZACIÓN DE LA CASTAÑA AMAZÓNICA"
      ]
    }
  },

  // ASIENTO 20 - José Roca Haensel (Beni)
  {
    id: 20,
    tipo: 'titular',
    seatNumber: 20,
    name: "José Roca Haensel",
    slug: generarSlug("José Roca Haensel"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Beni",
    comision: "Comité de Autonomías Municipales, Indigena Originario Campesinas y Regionales",
    cargo: "Secretario de Comite",
    foto: "/senadores/titulares/g3/JOSE ROCA HAENSEL.png",
    fechaNacimiento: "23 de febrero, 1977",
    nacidoEn: "Beni - General José Ballivian - Reyes",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 55,
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // ASIENTO 21 - Ana Karina Velasco Añez (Beni)
  {
    id: 21,
    tipo: 'titular',
    seatNumber: 21,
    name: "Ana Karina Velasco Añez",
    slug: generarSlug("Ana Karina Velasco Añez"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Beni",
    comision: "Comité de Fuerzas Armadas y Policía Boliviana",
    cargo: "Secretaria de comite",
    foto: "/senadores/titulares/g3/ANA KARINA VELASCO ÁÑEZ.png",
    fechaNacimiento: "19 de marzo, 1962",
    nacidoEn: "Beni - Cercado - Trinidad",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 56,
    proyectosLey: {
      cantidad: 7,
      lista: [
        "1. LEY DEL EJERCICIO PROFESIONAL DEL COMUNICADOR SOCIAL EN BOLIVIA",
        "2. DÍA DEL INMIGRANTE ITALIANO",
        "3. DE REGULARIZACIÓN DE DERECHO PROPIETARIO Y SALVAGUARDA DE PREDIOS DE LAS FUERZAS ARMADAS"
      ]
    }
  },

  // ASIENTO 22 - Ernesto Suarez Sattori (Beni)
  {
    id: 22,
    tipo: 'titular',
    seatNumber: 22,
    name: "Ernesto Suarez Sattori",
    slug: generarSlug("Ernesto Suarez Sattori"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Beni",
    comision: "Comité de Autonomías Departamentales",
    cargo: "Secretario de Comite",
    foto: "/senadores/titulares/g3/ERNESTO SUAREZ SATTORI.png",
    fechaNacimiento: "31 de marzo, 1966",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 57,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. DE LIBERTAD DE IMPORTACIÓN, ALMACENAJE, TRANSPORTE Y COMERCIALIZACIÓN DE COMBUSTIBLES LÍQUIDOS"
      ]
    }
  },

  // ASIENTO 23 - Ana María Crispin Choque (La Paz)
  {
    id: 23,
    tipo: 'titular',
    seatNumber: 23,
    name: "Ana María Crispin Choque",
    slug: generarSlug("Ana María Crispin Choque"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "La Paz",
    comision: "Comisión de Economía Plural, Producción e Industria",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g1/ANA MARIA CRISPIN CHOQUE.png",
    fechaNacimiento: "17 de septiembre, 1979",
    nacidoEn: "La Paz - Murillo - Nuestra Señora de La Paz",
    ocupacion: "Ingeniera en Producción Empresarial",
    facebook: "https://www.facebook.com/SenadoraAnitaCrispin",
    twitter: "https://x.com/anita_cris46800?s=11",
    instagram: "https://www.instagram.com/anitacrispinoficial?igsh=b3hqaGt2Y3FxcmZ3&igsi=b3hqaGt2Y3FxcmZ3",
    youtube: null,
    tiktok: "https://www.tiktok.com/@anita_crispin.oficial?_r=1&_t=ZS-98rLSuZ7QoM",
    suplenteId: 58,
    proyectosLey: {
      cantidad: 9,
      lista: [
        "1. LEY DE RESPONSABILIDAD FISCAL Y USO SOSTENIBLE DEL FINANCIAMIENTO EXTERNO",
        "2. DE ESTABILIDAD TRIBUTARIA, UNIFICACIÓN DEL IMPUESTO AL TABACO, MEDIDAS DE CONTROL AL CONSUMO Y FORTALECIMIENTO DEL CONTROL DEL MERCADO FORMAL",
        "3. PROYECTO DE LEY MARCO DE ACUERDOS PÚBLICO-PRIVADOS"
      ]
    }
  },

  // ASIENTO 24 - Julio Diego Romaña Galindo (Pando)
  {
    id: 24,
    tipo: 'titular',
    seatNumber: 24,
    name: "Julio Diego Romaña Galindo",
    slug: generarSlug("Julio Diego Romaña Galindo"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Pando",
    comision: "Directiva Legislatura 2025-2026",
    cargo: "Segunda Secretaria",
    foto: "/senadores/titulares/g3/JULIO DIEGO ROMAÑA GALINDO.png",
    fechaNacimiento: "15 de noviembre, 1972",
    nacidoEn: "Pando - Nicolas Suarez - Cobija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 59,
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. LEY DE PROTECCIÓN INTEGRAL DE LOS ANIMALES \"DIDA\""
      ]
    }
  },

  // ASIENTO 25 - Carol Carlo Durán (Pando)
  {
    id: 25,
    tipo: 'titular',
    seatNumber: 25,
    name: "Carol Carlo Durán",
    slug: generarSlug("Carol Carlo Durán"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Pando",
    comision: "Comité de Tierra y Territorio, Recursos Naturales y Hoja de la Coca",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g3/CAROL CARLO DURAN.png",
    fechaNacimiento: "28 de octubre, 1968",
    nacidoEn: "Pando - Nicolas Suarez - Cobija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 60,
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. DE INCORPORACIÓN A LA RED VIAL FUNDAMENTAL DEL TRAMO: DESDE CR.RT.F13 (VILLA BUSCH) HASTA MUKDEN EN LA PROVINCIA NICOLÁS SUÁREZ DEL DEPARTAMENTO DE PANDO"
      ]
    }
  },

  // ASIENTO 26 - Cintia Monica Puerta Campos (Pando)
  {
    id: 26,
    tipo: 'titular',
    seatNumber: 26,
    name: "Cintia Monica Puerta Campos",
    slug: generarSlug("Cintia Monica Puerta Campos"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Pando",
    comision: "Comité de Medio Ambiente, Biodiversidad, Amazonía, Áreas Protegidas y Cambio Climático",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g3/CINTIA MONICA PUERTA CAMPOS.png",
    fechaNacimiento: "16 de abril, 1976",
    nacidoEn: "Pando - Nicolas Suarez - Cobija",
    ocupacion: "Fisioterapeuta, Ciencias Politicas y Gestion Publica",
    facebook: "https://www.facebook.com/profile.php?id=61586932752308",
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 61,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY DE PRIORIDAD NACIONAL PARA LA CONCLUSIÓN Y EJECUCIÓN DE LA CARRETERA PORVENIR-EL CHORO DE LA RED VIAL FUNDAMENTAL N° 13 DEL DEPARTAMENTO DE PANDO"
      ]
    }
  },

  // ASIENTO 27 - Eliana Rina Acosta Quispe (Pando)
  {
    id: 27,
    tipo: 'titular',
    seatNumber: 27,
    name: "Eliana Rina Acosta Quispe",
    slug: generarSlug("Eliana Rina Acosta Quispe"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Pando",
    comision: "Comisión de Planificación, Política Económica y Finanzas",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g3/ELIANA RINA ACOSTA QUISPE.png",
    fechaNacimiento: "8 de septiembre, 1973",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: "Abogada",
    facebook: "https://www.facebook.com/profile.php?id=61584774578953",
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: "https://www.tiktok.com/@eliana.acosta.bol?_r=1&_t=ZS-92dfZ7y1V6C",
    suplenteId: 62,
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. LEY DE FORTALECIMIENTO, TRANSPARENCIA Y FORMALIZACIÓN DE LAS OPERACIONES CAMBIARIAS Y DE LAS CASAS DE CAMBIO"
      ]
    }
  },

  // ASIENTO 28 - Daniel Antonio Ortiz Velásquez (Chuquisaca)
  {
    id: 28,
    tipo: 'titular',
    seatNumber: 28,
    name: "Daniel Antonio Ortiz Velásquez",
    slug: generarSlug("Daniel Antonio Ortiz Velásquez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Chuquisaca",
    comision: "Comisión de Constitución, Derechos Humanos, Legislación y Sistema Electoral",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g1/DANIEL ANTONIO ORTIZ VELASQUEZ.png",
    fechaNacimiento: "2 de septiembre, 1986",
    nacidoEn: "La Paz - Murillo - Señora de La Paz",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 63,
    proyectosLey: {
      cantidad: 10,
      lista: [
        "1. QUE DECLARA Y REGULA COMO ZONA ECONÓMICA ESPECIAL AL DEPARTAMENTO DE CHUQUISACA",
        "2. LEY ESPECIAL DEL PROCEDIMIENTO DE LA JURISDICCIÓN AGROAMBIENTAL",
        "3. LEY PARA SUPRIMIR JUECES CIUDADANOS DEL TRIBUNAL DISCIPLINARIO Y MODIFICAR TODA LA NORMATIVA REFERIDA AL TRÁMITE DE LAS FALTAS GRAVÍSIMAS Y SANCIONES PREVISTAS EN LA LEY 025"
      ]
    }
  },

  // ASIENTO 29 - Maria Isabel Moreno Cortez (Tarija)
  {
    id: 29,
    tipo: 'titular',
    seatNumber: 29,
    name: "Maria Isabel Moreno Cortez",
    slug: generarSlug("Maria Isabel Moreno Cortez"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Tarija",
    comision: "Comité de Ministerio Público y Defensa Legal del Estado",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g2/MARIA ISABEL MORENO CORTEZ.png",
    fechaNacimiento: "13 de abril, 1966",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 64,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY DE PROTECCIÓN A LA IDENTIDAD Y DIGNIDAD CIVIL"
      ]
    }
  },

  // ASIENTO 30 - César Mentasti Padilla (Tarija)
  {
    id: 30,
    tipo: 'titular',
    seatNumber: 30,
    name: "César Mentasti Padilla",
    slug: generarSlug("César Mentasti Padilla"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Tarija",
    comision: "Comisión de Organización Territorial del Estado y Autonomías",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g2/CESAR MENTASTI PADILLA.png",
    fechaNacimiento: "18 de diciembre, 1978",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: "Lic. Ciencias Politicas",
    facebook: "https://www.facebook.com/profile.php?id=61572569973875&locale=es_LA",
    twitter: null,
    instagram: "https://www.instagram.com/mentasticesar/?hl=es",
    youtube: null,
    tiktok: "https://www.tiktok.com/@cesarmentasti?_r=1&_t=ZS-98suqHFWDXI",
    suplenteId: 65,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY DE ADECUACIÓN DEL FINANCIAMIENTO DE OBLIGACIONES PÚBLICAS"
      ]
    }
  },

  // ASIENTO 31 - Leonor Rosalva Romero Gutiérrez (Tarija)
  {
    id: 31,
    tipo: 'titular',
    seatNumber: 31,
    name: "Leonor Rosalva Romero Gutiérrez",
    slug: generarSlug("Leonor Rosalva Romero Gutiérrez"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Tarija",
    comision: "Comité de Planificación, Presupuesto, Inversión Pública y Contraloría General del Estado",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g2/LEONOR ROSALVA ROMERO GUTIERREZ.png",
    fechaNacimiento: "26 de enero, 1978",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: "Abogada",
    facebook: "https://www.facebook.com/profile.php?id=100088683621474",
    twitter: "https://x.com/RosalvaRomeroG",
    instagram: "https://www.instagram.com/rosalvaromero3",
    youtube: null,
    tiktok: "https://www.tiktok.com/@rosalvaromero",
    suplenteId: 66,
    proyectosLey: {
      cantidad: 16,
      lista: [
        "1. DE PROHIBICIÓN DE JUICIOS EN REBELDÍA Y DE PROTECCIÓN AL DEBIDO PROCESO",
        "2. DECLARA PATRIMONIO CULTURAL, MATERIAL A TODAS LAS INFRAESTRUCTURAS Y VESTIGIOS HISTÓRICOS DE LA GUERRA DEL CHACO, EN EL MUNICIPIO DE VILLA MONTES, REGIÓN AUTÓNOMA DEL GRAN CHACO, DEPARTAMENTO DE TARIJA",
        "3. LEY DE CREACIÓN DE LA ZONA ECONÓMICA ESPECIAL DE LA REGIÓN AUTÓNOMA DEL GRAN CHACO"
      ]
    }
  },

  // ASIENTO 32 - Diego Esteban Mateo Ávila Navajas (Tarija)
  {
    id: 32,
    tipo: 'titular',
    seatNumber: 32,
    name: "Diego Esteban Mateo Ávila Navajas",
    slug: generarSlug("Diego Esteban Mateo Ávila Navajas"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Tarija",
    comision: "Directiva Legislatura 2025-2026",
    cargo: "Presidente del Senado",
    foto: "/senadores/titulares/g2/DIEGO ESTEBAN MATEO ÁVILA NAVAJAS.png",
    fechaNacimiento: "21 de noviembre, 1961",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: "Economista",
    facebook: "https://www.facebook.com/senadordiegoavila?locale=es_LA",
    twitter: "https://x.com/diegoavilabo?s=11",
    instagram: "https://www.instagram.com/senadordiegoavila/?hl=es",
    youtube: null,
    tiktok: "https://www.tiktok.com/@diegoavilabo?is_from_webapp=1&sender_device=pc",
    suplenteId: 67,
    proyectosLey: {
      cantidad: 5,
      lista: [
        "1. LEY EXCEPCIONAL Y TRANSITORIA DE FUNCIONAMIENTO TRANSITORIO DEL TRIBUNAL CONSTITUCIONAL PLURINACIONAL",
        "2. LEY DE INCORPORACIÓN DE RUTAS DEPARTAMENTALES DE TARIJA A LA RED VIAL FUNDAMENTAL. (RUTA 1: CRUCE RUTA F11 (IBIBOBO)-ESMERALDA",
        "3. QUE ABROGA LA LEY N° 1341, DE 23 DE JULIO DE 2020, ESTADOS DE EXCEPCIÓN"
      ]
    }
  },

  // ASIENTO 33 - Yasmín Estivariz Villarroel (Oruro)
  {
    id: 33,
    tipo: 'titular',
    seatNumber: 33,
    name: "Yasmín Estivariz Villarroel",
    slug: generarSlug("Yasmín Estivariz Villarroel"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Oruro",
    comision: "Directiva Legislatura 2025-2026",
    cargo: "Primera Secretaria",
    foto: "/senadores/titulares/g2/YASMIN ESTIVARIZ VILLARROEL.png",
    fechaNacimiento: "23 de mayo, 1991",
    nacidoEn: "Oruro - Cercado - Oruro",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 68,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY EXCEPCIONAL Y TRANSITORIA DE FUNCIONAMIENTO TRANSITORIO DEL TRIBUNAL CONSTITUCIONAL PLURINACIONAL"
      ]
    }
  },

  // ASIENTO 34 - Freddy Castillo Chávez (Oruro)
  {
    id: 34,
    tipo: 'titular',
    seatNumber: 34,
    name: "Freddy Castillo Chávez",
    slug: generarSlug("Freddy Castillo Chávez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Oruro",
    comision: "Comité de Constitución, Legislación e Interpretación Legislativa y Constitucional",
    cargo: "Secretario de Comite",
    foto: "/senadores/titulares/g2/FREDDY CASTILLO CHAVEZ.png",
    fechaNacimiento: "22 de mayo, 1977",
    nacidoEn: "La Paz - Aroma - German Busch",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 69,
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. SISTEMA PRODUCTIVO DE CAMÉLIDOS SUDAMERICANOS DOMÉSTICOS"
      ]
    }
  },

  // ASIENTO 35 - Maria Antonieta Alcón Sánchez (Oruro)
  {
    id: 35,
    tipo: 'titular',
    seatNumber: 35,
    name: "Maria Antonieta Alcón Sánchez",
    slug: generarSlug("Maria Antonieta Alcón Sánchez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Oruro",
    comision: "Comité de Educación, Salud, Ciencia, Tecnología y Deporte",
    cargo: "Secretaria de Comite",
    foto: "/senadores/titulares/g2/MARIA ANTONIETA ALCON SANCHEZ.png",
    fechaNacimiento: "17 de enero, 1969",
    nacidoEn: "La Paz - Inquisivi - Colquiri",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 70,
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY DE ADECUACIÓN DEL FINANCIAMIENTO DE OBLIGACIONES PÚBLICAS"
      ]
    }
  },

  // ASIENTO 36 - José Sánchez Aguilar (Oruro)
  {
    id: 36,
    tipo: 'titular',
    seatNumber: 36,
    name: "José Sánchez Aguilar",
    slug: generarSlug("José Sánchez Aguilar"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Oruro",
    comision: "Comisión de Política Social",
    cargo: "Presidente de Comisión",
    foto: "/senadores/titulares/g2/JOSE SANCHEZ AGUILAR.png",
    fechaNacimiento: "31 de julio, 1958",
    nacidoEn: "Cochabamba - Quillacollo - Canarancho",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    suplenteId: 71,
    proyectosLey: {
      cantidad: 14,
      lista: [
        "1. LEY ESPECIAL PARA LA REGULACIÓN TÉCNICA DEL USO DE EXPLOSIVOS PARA EL DESARROLLO SOSTENIBLE Y CRECIMIENTO ECONÓMICO",
        "2. LEY DE INCENTIVO AL DEPORTE",
        "3. DE FOMENTO AL DESARROLLO PRODUCTIVO E INDUSTRIAL DE ORURO"
      ]
    }
  },

  // ==========================================
  // SUPLENTES (id: 37-71) - ORDENADOS POR SEATNUMBER
  // ==========================================

  // SUPLENTE 37 (Asiento 1) - Lenny Mayra Ayala Justiniano (Cochabamba)
  {
    id: 37,
    tipo: 'suplente',
    seatNumber: 1,
    name: "Lenny Mayra Ayala Justiniano",
    slug: generarSlug("Lenny Mayra Ayala Justiniano"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Cochabamba",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/LENNY MAYRA AYALA JUSTINIANO.png",
    fechaNacimiento: "19 de enero, 1990",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 1,
    suplenteDe: "Wilder Véliz Armas",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 38 (Asiento 2) - Royer Ivan Mamani Garcia (Cochabamba)
  {
    id: 38,
    tipo: 'suplente',
    seatNumber: 2,
    name: "Royer Ivan Mamani Garcia",
    slug: generarSlug("Royer Ivan Mamani Garcia"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Cochabamba",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/ROYER IVAN MAMANI GARCIA.png",
    fechaNacimiento: "15 de octubre, 1991",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 2,
    suplenteDe: "Judith Rosario García Coca",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 39 (Asiento 3) - Apolinar Rivera Muñoz (Cochabamba)
  {
    id: 39,
    tipo: 'suplente',
    seatNumber: 3,
    name: "Apolinar Rivera Muñoz",
    slug: generarSlug("Apolinar Rivera Muñoz"),
    party: "Autonomía para Bolivia Súmate",
    partyShort: "APB",
    partyColor: "#611789",
    department: "Cochabamba",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/APOLINAR RIVERA MUÑOZ.png",
    fechaNacimiento: "3 de septiembre, 1966",
    nacidoEn: "Potosí - Tomas Frias - Potosí",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 3,
    suplenteDe: "Claudia Mallón Vargas",
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. QUE DECLARA DÍA NACIONAL DEL CARRETILLERO Y ESTIBADOR EN CENTROS DE ABASTO DE BOLIVIA"
      ]
    }
  },

  // SUPLENTE 40 (Asiento 4) - Aldo Sergio Villegas Mora (Cochabamba)
  {
    id: 40,
    tipo: 'suplente',
    seatNumber: 4,
    name: "Aldo Sergio Villegas Mora",
    slug: generarSlug("Aldo Sergio Villegas Mora"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Cochabamba",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/ALDO SERGIO VILLEGAS MORA.png",
    fechaNacimiento: "20 de agosto, 1979",
    nacidoEn: "Oruro - Cercado - Oruro",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 4,
    suplenteDe: "Wanda Ximena Medrano Hervas",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 41 (Asiento 5) - Maria Elena Pachacute Ticona (La Paz)
  {
    id: 41,
    tipo: 'suplente',
    seatNumber: 5,
    name: "Maria Elena Pachacute Ticona",
    slug: generarSlug("Maria Elena Pachacute Ticona"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "La Paz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/MARIA ELENA PACHACUTE TICONA.png",
    fechaNacimiento: "5 de febrero, 1990",
    nacidoEn: "La Paz - Murillo - Señora de La Paz",
    ocupacion: "Lic. en Comercio Internacional y Comunicación Social",
    facebook: "https://www.facebook.com/share/1D8HNND7Ji/",
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: "https://www.tiktok.com/@elenapachacute?_r=1&_t=ZS-98rRgYCP1oz",
    titularId: 5,
    suplenteDe: "José Manuel Ormachea Mendieta",
    proyectosLey: {
      cantidad: 6,
      lista: [
        "1. LEY DEL RÉGIMEN TRIBUTARIO SIMPLIFICADO-RTS, PARA TRABAJADORES POR CUENTA PROPIA DEL ESTADO PLURINACIONAL DE BOLIVIA",
        "2. DE INCORPORACIONES DE NUEVAS TIPIFICACIONES AL CÓDIGO PENAL",
        "3. DE DEVOLUCIÓN DE APORTES DE LOS VENDEDORES DE LOTERÍA NACIONAL DE BENEFICENCIA Y SALUBRIDAD"
      ]
    }
  },

  // SUPLENTE 42 (Asiento 6) - Nilton Condori Alanoca (La Paz)
  {
    id: 42,
    tipo: 'suplente',
    seatNumber: 6,
    name: "Nilton Condori Alanoca",
    slug: generarSlug("Nilton Condori Alanoca"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "La Paz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/NILTON CONDORI ALANOCA.png",
    fechaNacimiento: "12 de octubre, 1968",
    nacidoEn: "La Paz - Omasuyos - Tojocachi",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 6,
    suplenteDe: "Carmen Soledad Chapeton Tancara",
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. LEY DE BLINDAJE DE LA JERARQUÍA PROFESIONAL, JUBILACIÓN PLENA AL CIEN POR CIENTO (100%) Y SEGURIDAD SOCIAL DE CORTO PLAZO DEL MAGISTERIO"
      ]
    }
  },

  // SUPLENTE 43 (Asiento 7) - Roxana Mamani Colquehuanca (La Paz)
  {
    id: 43,
    tipo: 'suplente',
    seatNumber: 7,
    name: "Roxana Mamani Colquehuanca",
    slug: generarSlug("Roxana Mamani Colquehuanca"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "La Paz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/ROXANA MAMANI COLQUEHUANCA.png",
    fechaNacimiento: "28 de septiembre, 1978",
    nacidoEn: "La Paz - Murillo - Señora de La Paz",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 7,
    suplenteDe: "Nicanor Gonzalo Cochi Condorí",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 44 (Asiento 8) - Hugo Marcelo Cortez Calvimontes (Chuquisaca)
  {
    id: 44,
    tipo: 'suplente',
    seatNumber: 8,
    name: "Hugo Marcelo Cortez Calvimontes",
    slug: generarSlug("Hugo Marcelo Cortez Calvimontes"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Chuquisaca",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/HUGO MARCELO CORTEZ CALVIMONTES.png",
    fechaNacimiento: "26 de enero, 1974",
    nacidoEn: "Chuquisaca - Oropeza - Sucre",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 8,
    suplenteDe: "Tomasa Yarhui Jacome",
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY DE VERDAD HISTÓRICA, REPARACIÓN MORAL Y PROTECCIÓN DE LA IMAGEN DE LA CIUDAD DE SUCRE"
      ]
    }
  },

  // SUPLENTE 45 (Asiento 9) - Ilse Fatima Davila Arancibia (Chuquisaca)
  {
    id: 45,
    tipo: 'suplente',
    seatNumber: 9,
    name: "Ilse Fatima Davila Arancibia",
    slug: generarSlug("Ilse Fatima Davila Arancibia"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Chuquisaca",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/ILSE FATIMA DAVILA ARANCIBIA.png",
    fechaNacimiento: "13 de mayo, 1984",
    nacidoEn: "Chuquisaca - Oropeza - Sucre",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 9,
    suplenteDe: "Abdon Porcel Arancibia",
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. LEY DE EMERGENCIA, PROTECCIÓN Y REACTIVACIÓN ECONÓMICA DEL SECTOR TURÍSTICO BOLIVIANO"
      ]
    }
  },

  // SUPLENTE 46 (Asiento 10) - Manfred Leo Perez Hassenteufel (Chuquisaca)
  {
    id: 46,
    tipo: 'suplente',
    seatNumber: 10,
    name: "Manfred Leo Perez Hassenteufel",
    slug: generarSlug("Manfred Leo Perez Hassenteufel"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Chuquisaca",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/MANFRED LEO PEREZ HASSENTEUFEL.png",
    fechaNacimiento: "14 de noviembre, 1971",
    nacidoEn: "Chuquisaca - Luis Calvo - Muyupampa",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 10,
    suplenteDe: "Bertha Cartagena Sánchez",
    proyectosLey: {
      cantidad: 5,
      lista: [
        "1. DE CREACIÓN DEL FONDO FINANCIERO DE RESERVA DE ORO DEL DEPARTAMENTO DE CHUQUISACA",
        "2. DE CREACIÓN DE BONOS DE CARBONO CON BENEFICIOS DE SEGURO JUBILATORIO PARA EL SECTOR AGROPECUARIO COMUNITARIO DE CHUQUISACA",
        "3. LEY TRANSITORIA DE COMPLEMENTACIÓN DE MAGISTRADAS Y MAGISTRADOS DEL TRIBUNAL CONSTITUCIONAL PLURINACIONAL Y DEL TRIBUNAL SUPREMO DE JUSTICIA"
      ]
    }
  },

  // SUPLENTE 47 (Asiento 11) - Kathia Natalia Miserendino Romero (Santa Cruz)
  {
    id: 47,
    tipo: 'suplente',
    seatNumber: 11,
    name: "Kathia Natalia Miserendino Romero",
    slug: generarSlug("Kathia Natalia Miserendino Romero"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Santa Cruz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/KATHIA NATALIA MISERENDINO ROMERO.png",
    fechaNacimiento: "15 de diciembre, 1993",
    nacidoEn: "Santa Cruz - Andrés Ibáñez - Santa Cruz de la Sierra",
    ocupacion: "Ing. Agrónoma",
    facebook: "https://www.facebook.com/katnat.miserendino",
    twitter: null,
    instagram: "https://www.instagram.com/senadoraporsantacruz/",
    youtube: null,
    tiktok: "https://www.tiktok.com/@nataliamiserendino",
    titularId: 11,
    suplenteDe: "Branko Goran Marinković Jovicevic",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 48 (Asiento 12) - Leonardo Roca Eguez (Santa Cruz)
  {
    id: 48,
    tipo: 'suplente',
    seatNumber: 12,
    name: "Leonardo Roca Eguez",
    slug: generarSlug("Leonardo Roca Eguez"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Santa Cruz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/LEONARDO ROCA EGUEZ.png",
    fechaNacimiento: "4 de junio, 1980",
    nacidoEn: "Santa Cruz - Andres Ibañez - Santa Cruz de la Sierra",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 12,
    suplenteDe: "Kathia Lizbeth Quiroga Fernández",
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. DE FORTALECIMIENTO DE PROTECCIÓN A LA PROPIEDAD PRIVADA"
      ]
    }
  },

  // SUPLENTE 49 (Asiento 13) - Lorgio Fernando Pareja Saucedo (Santa Cruz)
  {
    id: 49,
    tipo: 'suplente',
    seatNumber: 13,
    name: "Lorgio Fernando Pareja Saucedo",
    slug: generarSlug("Lorgio Fernando Pareja Saucedo"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Santa Cruz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/LORGIO FERNANDO PAREJA SAUCEDO.png",
    fechaNacimiento: "6 de diciembre, 1985",
    nacidoEn: "Santa Cruz - Andrés Ibáñez - Santa Cruz de la Sierra",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 13,
    suplenteDe: "Rosa Tatiana Áñez Carrasco",
    proyectosLey: {
      cantidad: 7,
      lista: [
        "1. DE MODIFICACIÓN AL ARTÍCULO 350 PARÁGRAFO III E INCLUSIÓN DEL PARÁGRAFO V DEL CÓDIGO PENAL, MODIFICADO POR LA LEY 1102 DEL CONSEJO NACIONAL DE LUCHA CONTRA EL AVASALLAMIENTO Y EL ABIGEATO-CONALCABI DEL 25 DE SEPTIEMBRE DE 2018",
        "2. DE PRESCRIPCIÓN Y CONSOLIDACIÓN DE DEPÓSITOS JUDICIALES",
        "3. LEY DE APOYO PRESUPUESTARIO FINANCIERO EXCEPCIONAL A FAVOR DE LOS GOBIERNOS AÚTONOMOS DEPARTAMENTALES"
      ]
    }
  },

  // SUPLENTE 50 (Asiento 14) - Richard Espada Ugarte (Santa Cruz)
  {
    id: 50,
    tipo: 'suplente',
    seatNumber: 14,
    name: "Richard Espada Ugarte",
    slug: generarSlug("Richard Espada Ugarte"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Santa Cruz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/RICHARD ESPADA UGARTE.png",
    fechaNacimiento: "6 de febrero, 1986",
    nacidoEn: "Santa Cruz - Andrés Ibáñez - Santa Cruz de la Sierra",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 14,
    suplenteDe: "Paola Limbania López Zeballos",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 51 (Asiento 15) - Roger Mamani Coronado (Potosí)
  {
    id: 51,
    tipo: 'suplente',
    seatNumber: 15,
    name: "Roger Mamani Coronado",
    slug: generarSlug("Roger Mamani Coronado"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Potosí",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/ROGER MAMANI CORONADO.png",
    fechaNacimiento: "24 de junio, 1977",
    nacidoEn: "Potosí - Tomas Frias - Potosí",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 15,
    suplenteDe: "Betty Canaviri Villanueva",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 52 (Asiento 17) - Susana Gabriela Ruiz Zuleta (Potosí)
  {
    id: 52,
    tipo: 'suplente',
    seatNumber: 17,
    name: "Susana Gabriela Ruiz Zuleta",
    slug: generarSlug("Susana Gabriela Ruiz Zuleta"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Potosí",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/SUSANA GABRIELA RUIZ ZULETA.png",
    fechaNacimiento: "12 de diciembre, 1984",
    nacidoEn: "Potosí - Tomas Frias - Potosí",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 17,
    suplenteDe: "Marcelino Flores Ordoñez",
    proyectosLey: {
      cantidad: 4,
      lista: [
        "1. QUE DECLARA DE INTERÉS DEL NIVEL CENTRAL DEL ESTADO LA CONSTRUCCIÓN DE TRANSPORTE POR CABLE (TELEFÉRICO) EN LA CIUDAD DE POTOSÍ",
        "2. LEY DE IMPLEMENTACIÓN DE LA INTELIGENCIA ARTIFICIAL (IA) EN EL SISTEMA EDUCATIVO PLURINACIONAL DE BOLIVIA"
      ]
    }
  },

  // SUPLENTE 53 (Asiento 18) - Freddy Rioja Melgar (Potosí)
  {
    id: 53,
    tipo: 'suplente',
    seatNumber: 18,
    name: "Freddy Rioja Melgar",
    slug: generarSlug("Freddy Rioja Melgar"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Potosí",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/FREDDY RIOJA MELGAR.png",
    fechaNacimiento: "20 de abril, 1957",
    nacidoEn: "Santa Cruz - Cordillera - Camiri",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 18,
    suplenteDe: "Bertha Nurmy Gutiérrez Meneses",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 54 (Asiento 19) - Cesia Roca Escalante (Beni)
  {
    id: 54,
    tipo: 'suplente',
    seatNumber: 19,
    name: "Cesia Roca Escalante",
    slug: generarSlug("Cesia Roca Escalante"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Beni",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/CESIA ROCA ESCALANTE.png",
    fechaNacimiento: "30 de julio, 1971",
    nacidoEn: "Beni - Vaca Diez - Riberalta",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 19,
    suplenteDe: "Erick Nelson Soruco Alpire",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 55 (Asiento 20) - Mabel Giordano Sonnenschein (Beni)
  {
    id: 55,
    tipo: 'suplente',
    seatNumber: 20,
    name: "Mabel Giordano Sonnenschein",
    slug: generarSlug("Mabel Giordano Sonnenschein"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Beni",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/MABEL GIORDANO SONNENSCHEIN.png",
    fechaNacimiento: "15 de enero, 1985",
    nacidoEn: "Beni - Vaca Diez - Riberalta",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 20,
    suplenteDe: "José Roca Haensel",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 56 (Asiento 21) - Marcelo Matias Cardona Ibañez (Beni)
  {
    id: 56,
    tipo: 'suplente',
    seatNumber: 21,
    name: "Marcelo Matias Cardona Ibañez",
    slug: generarSlug("Marcelo Matias Cardona Ibañez"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Beni",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/MARCELO MATIAS CARDONA IBAÑEZ.png",
    fechaNacimiento: "5 de enero, 1982",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 21,
    suplenteDe: "Ana Karina Velasco Añez",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 57 (Asiento 22) - Claudia Cardenas Velasquez (Beni)
  {
    id: 57,
    tipo: 'suplente',
    seatNumber: 22,
    name: "Claudia Cardenas Velasquez",
    slug: generarSlug("Claudia Cardenas Velasquez"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Beni",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/CLAUDIA CARDENAS VELASQUEZ.png",
    fechaNacimiento: "2 de julio, 1969",
    nacidoEn: "Cochabamba - Cercado - Cochabamba",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 22,
    suplenteDe: "Ernesto Suarez Sattori",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 58 (Asiento 23) - Victor Severo Quispe Santander (La Paz)
  {
    id: 58,
    tipo: 'suplente',
    seatNumber: 23,
    name: "Victor Severo Quispe Santander",
    slug: generarSlug("Victor Severo Quispe Santander"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "La Paz",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/VICTOR SEVERO QUISPE SANTANDER.png",
    fechaNacimiento: "1 de febrero, 1971",
    nacidoEn: "La Paz - Murillo - Nuestra Señora de La Paz",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 23,
    suplenteDe: "Ana María Crispin Choque",
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. QUE DECLARA AL MUNICIPIO DE GUAQUI COMO \"CAPITAL FOLKLÓRICA DE LA MORENADA\", DEL ESTADO PLURINACIONAL DE BOLIVIA"
      ]
    }
  },

  // SUPLENTE 59 (Asiento 24) - Carolina Giese Urresti (Pando)
  {
    id: 59,
    tipo: 'suplente',
    seatNumber: 24,
    name: "Carolina Giese Urresti",
    slug: generarSlug("Carolina Giese Urresti"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Pando",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/CAROLINA GIESE URRESTI.png",
    fechaNacimiento: "9 de noviembre, 1996",
    nacidoEn: "Pando - Nicolas Suarez - Cobija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 24,
    suplenteDe: "Julio Diego Romaña Galindo",
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. LEY DE PROTECCIÓN INTEGRAL DE LOS ANIMALES \"DIDA\""
      ]
    }
  },

  // SUPLENTE 60 (Asiento 25) - Jorge Antonio Quispe Flores (Pando)
  {
    id: 60,
    tipo: 'suplente',
    seatNumber: 25,
    name: "Jorge Antonio Quispe Flores",
    slug: generarSlug("Jorge Antonio Quispe Flores"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Pando",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/JORGE ANTONIO QUISPE FLORES.png",
    fechaNacimiento: "15 de enero, 1991",
    nacidoEn: "Pando - Nicolas Suarez - Cobija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 25,
    suplenteDe: "Carol Carlo Durán",
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. DE INCORPORACIÓN A LA RED VIAL FUNDAMENTAL DEL TRAMO: SANTA ELENA (MUNICIPIO DE BELLA FLOR, PROVINCIA NICOLÁS SUÁREZ)-SANTA ROSA (MUNICIPIO DE SANTA ROSA DE LA PROVINCIA ABUNÁ) DEL DEPARTAMENTO DE PANDO"
      ]
    }
  },

  // SUPLENTE 61 (Asiento 26) - Jesus Humberto Suarez Eguez (Pando)
  {
    id: 61,
    tipo: 'suplente',
    seatNumber: 26,
    name: "Jesus Humberto Suarez Eguez",
    slug: generarSlug("Jesus Humberto Suarez Eguez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Pando",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/JESUS HUMBERTO SUAREZ EGUEZ.png",
    fechaNacimiento: "29 de mayo, 1980",
    nacidoEn: "Beni - Cercado - Trinidad",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 26,
    suplenteDe: "Cintia Monica Puerta Campos",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 62 (Asiento 27) - Sichard Hans Soraide Castedo (Pando)
  {
    id: 62,
    tipo: 'suplente',
    seatNumber: 27,
    name: "Sichard Hans Soraide Castedo",
    slug: generarSlug("Sichard Hans Soraide Castedo"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Pando",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g3/SICHARD HANS SORAIDE CASTEDO.png",
    fechaNacimiento: "28 de octubre, 1983",
    nacidoEn: "Santa Cruz - Andres Ibañez - Santa Cruz de la Sierra",
    ocupacion: "Ingeniero Informático",
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 27,
    suplenteDe: "Eliana Rina Acosta Quispe",
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. DE INCORPORACIÓN A LA RED VIAL FUNDAMENTAL DEL TRAMO: SANTA ELENA (MUNICIPIO DE BELLA FLOR, PROVINCIA NICOLÁS SUÁREZ)-SANTA ROSA (MUNICIPIO DE SANTA ROSA DE LA PROVINCIA ABUNÁ) DEL DEPARTAMENTO DE PANDO"
      ]
    }
  },

  // SUPLENTE 63 (Asiento 28) - Reina Isabel Pallares Morales (Chuquisaca)
  {
    id: 63,
    tipo: 'suplente',
    seatNumber: 28,
    name: "Reina Isabel Pallares Morales",
    slug: generarSlug("Reina Isabel Pallares Morales"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Chuquisaca",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g1/REINA ISABEL PALLARES MORALES.png",
    fechaNacimiento: "16 de noviembre, 1963",
    nacidoEn: "Potosí - Chayanta - Ravelo",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 28,
    suplenteDe: "Daniel Antonio Ortiz Velásquez",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 64 (Asiento 29) - Rolando Vacaflor Gabriel Arana (Tarija)
  {
    id: 64,
    tipo: 'suplente',
    seatNumber: 29,
    name: "Rolando Vacaflor Gabriel Arana",
    slug: generarSlug("Rolando Vacaflor Gabriel Arana"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Tarija",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/ROLANDO VACAFLOR GABRIEL ARANA.png",
    fechaNacimiento: "18 de mayo, 1994",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 29,
    suplenteDe: "Maria Isabel Moreno Cortez",
    proyectosLey: {
      cantidad: 5,
      lista: [
        "1. DE PROTECCIÓN Y EJERCICIO DE DERECHOS FUNDAMENTALES Y GARANTÍAS CONSTITUCIONALES",
        "2. DE DEROGACIÓN DE LA LEY N° 767 Y RESTITUCIÓN DE FONDOS DEL FPIEEH A ENTIDADES TERRITORIALES Y UNIVERSIDADES"
      ]
    }
  },

  // SUPLENTE 65 (Asiento 30) - Marcela Guerrero Vilca (Tarija)
  {
    id: 65,
    tipo: 'suplente',
    seatNumber: 30,
    name: "Marcela Guerrero Vilca",
    slug: generarSlug("Marcela Guerrero Vilca"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Tarija",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/MARCELA GUERRERO VILCA.png",
    fechaNacimiento: "10 de octubre, 1988",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 30,
    suplenteDe: "César Mentasti Padilla",
    proyectosLey: {
      cantidad: 11,
      lista: [
        "1. LEY DE LUCHA CONTRA LA CORRUPCIÓN POR ENRRIQUECIMIENTO ILÍCITO DE DIRIGENTES",
        "2. DE FORTALECIMIENTO PRODUCTIVO DE LA PEQUEÑA PROPIEDAD AGRARIA",
        "3. LEY DE FINANCIAMIENTO PREFERENCIAL DESTINADO A LOS SECTORES PRODUCTIVOS AFECTADOS POR LOS CONFLICTOS SOCIALES, BLOQUEOS Y EVENTOS ADVERSOS"
      ]
    }
  },

  // SUPLENTE 66 (Asiento 31) - Marco Antonio Segovia Vargas (Tarija)
  {
    id: 66,
    tipo: 'suplente',
    seatNumber: 31,
    name: "Marco Antonio Segovia Vargas",
    slug: generarSlug("Marco Antonio Segovia Vargas"),
    party: "Unidad",
    partyShort: "UNIDAD",
    partyColor: "#EFCD04",
    department: "Tarija",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/MARCO ANTONIO SEGOVIA VARGAS.png",
    fechaNacimiento: "30 de agosto, 1963",
    nacidoEn: "Tarija - Cercado - Tarija",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 31,
    suplenteDe: "Leonor Rosalva Romero Gutiérrez",
    proyectosLey: {
      cantidad: 3,
      lista: [
        "1. LEY DE CREACIÓN DE LA UNIDAD EJECUTORA CARRIZAL"
      ]
    }
  },

  // SUPLENTE 67 (Asiento 32) - Luzmaya Zelaya Vega (Tarija)
  {
    id: 67,
    tipo: 'suplente',
    seatNumber: 32,
    name: "Luzmaya Zelaya Vega",
    slug: generarSlug("Luzmaya Zelaya Vega"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Tarija",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/LUZMAYA ZELAYA VEGA.png",
    fechaNacimiento: "10 de febrero, 1987",
    nacidoEn: "Chuquisaca - Hernando Silez - San Pablo de Huacareta",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 32,
    suplenteDe: "Diego Esteban Mateo Ávila Navajas",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 68 (Asiento 33) - Ramiro Mamani Ramirez (Oruro)
  {
    id: 68,
    tipo: 'suplente',
    seatNumber: 33,
    name: "Ramiro Mamani Ramirez",
    slug: generarSlug("Ramiro Mamani Ramirez"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Oruro",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/RAMIRO MAMANI RAMIREZ.png",
    fechaNacimiento: "1 de agosto, 1990",
    nacidoEn: "Potosí - Alonso de Ibañez - Chojlla",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 33,
    suplenteDe: "Yasmín Estivariz Villarroel",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 69 (Asiento 34) - Villma Colque Camacho (Oruro)
  {
    id: 69,
    tipo: 'suplente',
    seatNumber: 34,
    name: "Villma Colque Camacho",
    slug: generarSlug("Villma Colque Camacho"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Oruro",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/VILLMA COLQUE CAMACHO.png",
    fechaNacimiento: "10 de mayo, 1983",
    nacidoEn: "La Paz - Inquisivi - Choquetanga",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 34,
    suplenteDe: "Freddy Castillo Chávez",
    proyectosLey: {
      cantidad: 0,
      lista: []
    }
  },

  // SUPLENTE 70 (Asiento 35) - Edwin Lopez Quiroga (Oruro)
  {
    id: 70,
    tipo: 'suplente',
    seatNumber: 35,
    name: "Edwin Lopez Quiroga",
    slug: generarSlug("Edwin Lopez Quiroga"),
    party: "Partido Demócrata Cristiano",
    partyShort: "PDC",
    partyColor: "#2E7078",
    department: "Oruro",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/EDWIN LOPEZ QUIROGA.png",
    fechaNacimiento: "14 de junio, 1957",
    nacidoEn: "Oruro - Cercado - Oruro",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 35,
    suplenteDe: "Maria Antonieta Alcón Sánchez",
    proyectosLey: {
      cantidad: 1,
      lista: [
        "1. QUE DECLARA DE INTERÉS Y PRIORIDAD NACIONAL LA INCORPORACIÓN A LA RED VIAL FUNDAMENTAL DE CARRETERAS EL TRAMO SANTUARIO DE QUILLACAS-SALINAS DE GARCI MENDOZA-LLICA-BELLA VISTA DE LOS DEPARTAMENTOS DE ORURO Y POTOSÍ"
      ]
    }
  },

  // SUPLENTE 71 (Asiento 36) - Cinthya Inga Gutierrez Guzman (Oruro)
  {
    id: 71,
    tipo: 'suplente',
    seatNumber: 36,
    name: "Cinthya Inga Gutierrez Guzman",
    slug: generarSlug("Cinthya Inga Gutierrez Guzman"),
    party: "Libre",
    partyShort: "LIBRE",
    partyColor: "#DB3737",
    department: "Oruro",
    comite: null,
    comision: null,
    cargo: null,
    foto: "/senadores/suplentes/g2/CINTHYA INGA GUTIERREZ GUZMAN.png",
    fechaNacimiento: "15 de noviembre, 1981",
    nacidoEn: "Oruro - Cercado - Oruro",
    ocupacion: null,
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    titularId: 36,
    suplenteDe: "José Sánchez Aguilar",
    proyectosLey: {
      cantidad: 2,
      lista: [
        "1. DE ATENCIÓN PRE-HOSPITALARIA DEL ESTADO PLURINACIONAL DE BOLIVIA"
      ]
    }
  }
]