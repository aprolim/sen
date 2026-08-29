// src/scripts/seedAll.js
// SCRIPT ÚNICO - Carga TODOS los datos: Senadores + Suplentes + Comisiones
// Ejecutar: node src/scripts/seedAll.js --force

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// MODELOS
// ============================================
const Senador = require('../models/Senador');
const Comision = require('../models/Comision');

// ============================================
// FUNCIÓN PARA GENERAR SLUG
// ============================================
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

// ============================================
// 🔥 DATA DE SENADORES (TITULARES + SUPLENTES CON FOTOS)
// ============================================
const SENADORES_DATA = [
  // ============================================
  // SENADORES TITULARES (36)
  // ============================================
  { 
    id: 1, seatNumber: 1, name: "Wilder Véliz Armas", slug: generarSlug("Wilder Véliz Armas"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Cochabamba",
    foto: "/senadores/titulares/g1/WILDER VELIZ ARMAS.png",
    suplente: "Lenny Mayra Ayala Justiniano", slugSuplente: generarSlug("Lenny Mayra Ayala Justiniano"),
    fotoSuplente: "/senadores/suplentes/g1/LENNY MAYRA AYALA JUSTINIANO.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 2, seatNumber: 2, name: "Judith Rosario García Coca", slug: generarSlug("Judith Rosario García Coca"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Potosí",
    foto: "/senadores/titulares/g1/JUDITH ROSARIO GARCIA COCA.png",
    suplente: "Royer Ivan Mamani Garcia", slugSuplente: generarSlug("Royer Ivan Mamani Garcia"),
    fotoSuplente: "/senadores/suplentes/g1/ROYER IVAN MAMANI GARCIA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 3, seatNumber: 3, name: "Claudia Mallón Vargas", slug: generarSlug("Claudia Mallón Vargas"), tipo: 'titular',
    party: "Autonomía para Bolivia Súmate", partyShort: "APB", partyColor: "#611789", department: "Cochabamba",
    foto: "/senadores/titulares/g1/CLAUDIA MALLON VARGAS.png",
    suplente: "Apolinar Rivera Muñoz", slugSuplente: generarSlug("Apolinar Rivera Muñoz"),
    fotoSuplente: "/senadores/suplentes/g1/APOLINAR RIVERA MUÑOZ.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 4, seatNumber: 4, name: "Wanda Ximena Medrano Hervas", slug: generarSlug("Wanda Ximena Medrano Hervas"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Cochabamba",
    foto: "/senadores/titulares/g1/WANDA XIMENA MEDRANO HERVAS.png",
    suplente: "Aldo Sergio Villegas Mora", slugSuplente: generarSlug("Aldo Sergio Villegas Mora"),
    fotoSuplente: "/senadores/suplentes/g1/ALDO SERGIO VILLEGAS MORA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 5, seatNumber: 5, name: "José Manuel Ormachea Mendieta", slug: generarSlug("José Manuel Ormachea Mendieta"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "La Paz",
    foto: "/senadores/titulares/g1/JOSE MANUEL ORMACHEA MENDIETA.png",
    suplente: "Maria Elena Pachacute Ticona", slugSuplente: generarSlug("Maria Elena Pachacute Ticona"),
    fotoSuplente: "/senadores/suplentes/g1/MARIA ELENA PACHACUTE TICONA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 6, seatNumber: 6, name: "Carmen Soledad Chapeton Tancara", slug: generarSlug("Carmen Soledad Chapeton Tancara"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "La Paz",
    foto: "/senadores/titulares/g1/CARMEN SOLEDAD CHAPETÓN TANCARA.png",
    suplente: "Nilton Condori Alanoca", slugSuplente: generarSlug("Nilton Condori Alanoca"),
    fotoSuplente: "/senadores/suplentes/g1/NILTON CONDORI ALANOCA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 7, seatNumber: 7, name: "Nicanor Gonzalo Cochi Condorí", slug: generarSlug("Nicanor Gonzalo Cochi Condorí"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "La Paz",
    foto: "/senadores/titulares/g1/NICANOR GONZALO COCHI CONDORI.png",
    suplente: "Roxana Mamani Colquehuanca", slugSuplente: generarSlug("Roxana Mamani Colquehuanca"),
    fotoSuplente: "/senadores/suplentes/g1/ROXANA MAMANI COLQUEHUANCA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 8, seatNumber: 8, name: "Tomasa Yarhui Jacome", slug: generarSlug("Tomasa Yarhui Jacome"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Chuquisaca",
    foto: "/senadores/titulares/g1/TOMASA YARHUI JACOME.png",
    suplente: "Hugo Marcelo Cortez Calvimontes", slugSuplente: generarSlug("Hugo Marcelo Cortez Calvimontes"),
    fotoSuplente: "/senadores/suplentes/g1/HUGO MARCELO CORTEZ CALVIMONTES.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 9, seatNumber: 9, name: "Abdon Porcel Arancibia", slug: generarSlug("Abdon Porcel Arancibia"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Chuquisaca",
    foto: "/senadores/titulares/g1/ABDON PORCEL ARANCIBIA.png",
    suplente: "Ilse Fatima Davila Arancibia", slugSuplente: generarSlug("Ilse Fatima Davila Arancibia"),
    fotoSuplente: "/senadores/suplentes/g1/ILSE FATIMA DAVILA ARANCIBIA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 10, seatNumber: 10, name: "Bertha Cartagena Sánchez", slug: generarSlug("Bertha Cartagena Sánchez"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Chuquisaca",
    foto: "/senadores/titulares/g1/BERTHA CARTAGENA SANCHEZ.png",
    suplente: "Manfred Leo Perez Hassenteufel", slugSuplente: generarSlug("Manfred Leo Perez Hassenteufel"),
    fotoSuplente: "/senadores/suplentes/g1/MANFRED LEO PEREZ HASSENTEUFEL.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 11, seatNumber: 11, name: "Branko Goran Marinković Jovicevic", slug: generarSlug("Branko Goran Marinković Jovicevic"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Santa Cruz",
    foto: "/senadores/titulares/g3/BRANKO GORAN MARINKOVIC JOVICEVIC.png",
    suplente: "Kathia Natalia Miserendino Romero", slugSuplente: generarSlug("Kathia Natalia Miserendino Romero"),
    fotoSuplente: "/senadores/suplentes/g3/KATHIA NATALIA MISERENDINO ROMERO.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 12, seatNumber: 12, name: "Kathia Lizbeth Quiroga Fernández", slug: generarSlug("Kathia Lizbeth Quiroga Fernández"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Santa Cruz",
    foto: "/senadores/titulares/g3/KATHIA LISBETH QUIROGA FERNÁNDEZ.png",
    suplente: "Leonardo Roca Eguez", slugSuplente: generarSlug("Leonardo Roca Eguez"),
    fotoSuplente: "/senadores/suplentes/g3/LEONARDO ROCA EGUEZ.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 13, seatNumber: 13, name: "Rosa Tatiana Áñez Carrasco", slug: generarSlug("Rosa Tatiana Áñez Carrasco"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "Santa Cruz",
    foto: "/senadores/titulares/g3/ROSA TATIANA AÑEZ CARRASCO.png",
    suplente: "Lorgio Fernando Pareja Saucedo", slugSuplente: generarSlug("Lorgio Fernando Pareja Saucedo"),
    fotoSuplente: "/senadores/suplentes/g3/LORGIO FERNANDO PAREJA SAUCEDO.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 14, seatNumber: 14, name: "Paola Limbania López Zeballos", slug: generarSlug("Paola Limbania López Zeballos"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Cochabamba",
    foto: "/senadores/titulares/g3/PAOLA LIMBANIA LOPEZ ZEBALLOS.png",
    suplente: "Richard Espada Ugarte", slugSuplente: generarSlug("Richard Espada Ugarte"),
    fotoSuplente: "/senadores/suplentes/g3/RICHARD ESPADA UGARTE.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 15, seatNumber: 15, name: "Betty Canaviri Villanueva", slug: generarSlug("Betty Canaviri Villanueva"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Potosí",
    foto: "/senadores/titulares/g2/BETTY CANAVIRI VILLANUEVA.png",
    suplente: "Roger Mamani Coronado", slugSuplente: generarSlug("Roger Mamani Coronado"),
    fotoSuplente: "/senadores/suplentes/g2/ROGER MAMANI CORONADO.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 16, seatNumber: 16, name: "Teresa Alarcón Arana", slug: generarSlug("Teresa Alarcón Arana"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Potosí",
    foto: "/senadores/titulares/g2/TERESA ALARCON ARANA.png",
    suplente: null, slugSuplente: null, fotoSuplente: null, cargoSuplente: null
  },
  { 
    id: 17, seatNumber: 17, name: "Marcelino Flores Ordoñez", slug: generarSlug("Marcelino Flores Ordoñez"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Potosí",
    foto: "/senadores/titulares/g2/MARCELINO FLORES ORDOÑEZ.png",
    suplente: "Susana Gabriela Ruiz Zuleta", slugSuplente: generarSlug("Susana Gabriela Ruiz Zuleta"),
    fotoSuplente: "/senadores/suplentes/g2/SUSANA GABRIELA RUIZ ZULETA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 18, seatNumber: 18, name: "Bertha Nurmy Gutiérrez Meneses", slug: generarSlug("Bertha Nurmy Gutiérrez Meneses"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Potosí",
    foto: "/senadores/titulares/g2/BERTHA NURMY GUTIERREZ MENESES.png",
    suplente: "Freddy Rioja Melgar", slugSuplente: generarSlug("Freddy Rioja Melgar"),
    fotoSuplente: "/senadores/suplentes/g2/FREDDY RIOJA MELGAR.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 19, seatNumber: 19, name: "Erick Nelson Soruco Alpire", slug: generarSlug("Erick Nelson Soruco Alpire"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Beni",
    foto: "/senadores/titulares/g3/ERICK NELSON SORUCO ALPIRE.png",
    suplente: "Cesia Roca Escalante", slugSuplente: generarSlug("Cesia Roca Escalante"),
    fotoSuplente: "/senadores/suplentes/g3/CESIA ROCA ESCALANTE.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 20, seatNumber: 20, name: "José Roca Haensel", slug: generarSlug("José Roca Haensel"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "Beni",
    foto: "/senadores/titulares/g3/JOSE ROCA HAENSEL.png",
    suplente: "Mabel Giordano Sonnenschein", slugSuplente: generarSlug("Mabel Giordano Sonnenschein"),
    fotoSuplente: "/senadores/suplentes/g3/MABEL GIORDANO SONNENSCHEIN.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 21, seatNumber: 21, name: "Ana Karina Velasco Añez", slug: generarSlug("Ana Karina Velasco Añez"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "Beni",
    foto: "/senadores/titulares/g3/ANA KARINA VELASCO ÁÑEZ.png",
    suplente: "Marcelo Matias Cardona Ibañez", slugSuplente: generarSlug("Marcelo Matias Cardona Ibañez"),
    fotoSuplente: "/senadores/suplentes/g3/MARCELO MATIAS CARDONA IBAÑEZ.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 22, seatNumber: 22, name: "Ernesto Suarez Sattori", slug: generarSlug("Ernesto Suarez Sattori"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Cochabamba",
    foto: "/senadores/titulares/g3/ERNESTO SUAREZ SATTORI.png",
    suplente: "Claudia Cardenas Velasquez", slugSuplente: generarSlug("Claudia Cardenas Velasquez"),
    fotoSuplente: "/senadores/suplentes/g3/CLAUDIA CARDENAS VELASQUEZ.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 23, seatNumber: 23, name: "Ana María Crispin Choque", slug: generarSlug("Ana María Crispin Choque"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "La Paz",
    foto: "/senadores/titulares/g1/ANA MARIA CRISPIN CHOQUE.png",
    suplente: "Victor Severo Quispe Santander", slugSuplente: generarSlug("Victor Severo Quispe Santander"),
    fotoSuplente: "/senadores/suplentes/g1/VICTOR SEVERO QUISPE SANTANDER.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 24, seatNumber: 24, name: "Julio Diego Romaña Galindo", slug: generarSlug("Julio Diego Romaña Galindo"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Pando",
    foto: "/senadores/titulares/g3/JULIO DIEGO ROMAÑA GALINDO.png",
    suplente: "Carolina Giese Urresti", slugSuplente: generarSlug("Carolina Giese Urresti"),
    fotoSuplente: "/senadores/suplentes/g3/CAROLINA GIESE URRESTI.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 25, seatNumber: 25, name: "Carol Carlo Durán", slug: generarSlug("Carol Carlo Durán"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Pando",
    foto: "/senadores/titulares/g3/CAROL CARLO DURAN.png",
    suplente: "Jorge Antonio Quispe Flores", slugSuplente: generarSlug("Jorge Antonio Quispe Flores"),
    fotoSuplente: "/senadores/suplentes/g3/JORGE ANTONIO QUISPE FLORES.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 26, seatNumber: 26, name: "Cintia Monica Puerta Campos", slug: generarSlug("Cintia Monica Puerta Campos"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Pando",
    foto: "/senadores/titulares/g3/CINTIA MONICA PUERTA CAMPOS.png",
    suplente: "Jesus Humberto Suarez Eguez", slugSuplente: generarSlug("Jesus Humberto Suarez Eguez"),
    fotoSuplente: "/senadores/suplentes/g3/JESUS HUMBERTO SUAREZ EGUEZ.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 27, seatNumber: 27, name: "Eliana Rina Acosta Quispe", slug: generarSlug("Eliana Rina Acosta Quispe"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "Cochabamba",
    foto: "/senadores/titulares/g3/ELIANA RINA ACOSTA QUISPE.png",
    suplente: "Sichard Hans Soraide Castedo", slugSuplente: generarSlug("Sichard Hans Soraide Castedo"),
    fotoSuplente: "/senadores/suplentes/g3/SICHARD HANS SORAIDE CASTEDO.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 28, seatNumber: 28, name: "Daniel Antonio Ortiz Velásquez", slug: generarSlug("Daniel Antonio Ortiz Velásquez"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "La Paz",
    foto: "/senadores/titulares/g1/DANIEL ANTONIO ORTIZ VELASQUEZ.png",
    suplente: "Reina Isabel Pallares Morales", slugSuplente: generarSlug("Reina Isabel Pallares Morales"),
    fotoSuplente: "/senadores/suplentes/g1/REINA ISABEL PALLARES MORALES.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 29, seatNumber: 29, name: "María Isabel Moreno Cortez", slug: generarSlug("María Isabel Moreno Cortez"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Tarija",
    foto: "/senadores/titulares/g2/MARIA ISABEL MORENO CORTEZ.png",
    suplente: "Rolando Vacaflor Gabriel Arana", slugSuplente: generarSlug("Rolando Vacaflor Gabriel Arana"),
    fotoSuplente: "/senadores/suplentes/g2/ROLANDO VACAFLOR GABRIEL ARANA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 30, seatNumber: 30, name: "César Mentasti Padilla", slug: generarSlug("César Mentasti Padilla"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "Tarija",
    foto: "/senadores/titulares/g2/CESAR MENTASTI PADILLA.png",
    suplente: "Marcela Guerrero Vilca", slugSuplente: generarSlug("Marcela Guerrero Vilca"),
    fotoSuplente: "/senadores/suplentes/g2/MARCELA GUERRERO VILCA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 31, seatNumber: 31, name: "Leonor Rosalva Romero Gutiérrez", slug: generarSlug("Leonor Rosalva Romero Gutiérrez"), tipo: 'titular',
    party: "Unidad", partyShort: "UNIDAD", partyColor: "#EFCD04", department: "Tarija",
    foto: "/senadores/titulares/g2/LEONOR ROSALVA ROMERO GUTIERREZ.png",
    suplente: "Marco Antonio Segovia Vargas", slugSuplente: generarSlug("Marco Antonio Segovia Vargas"),
    fotoSuplente: "/senadores/suplentes/g2/MARCO ANTONIO SEGOVIA VARGAS.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 32, seatNumber: 32, name: "Diego Esteban Mateo Ávila Navajas", slug: generarSlug("Diego Esteban Mateo Ávila Navajas"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Tarija",
    foto: "/senadores/titulares/g2/DIEGO ESTEBAN MATEO ÁVILA NAVAJAS.png",
    suplente: "Luzmaya Zelaya Vega", slugSuplente: generarSlug("Luzmaya Zelaya Vega"),
    fotoSuplente: "/senadores/suplentes/g2/LUZMAYA ZELAYA VEGA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 33, seatNumber: 33, name: "Yasmín Estivariz Villarroel", slug: generarSlug("Yasmín Estivariz Villarroel"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "Oruro",
    foto: "/senadores/titulares/g2/YASMIN ESTIVARIZ VILLARROEL.png",
    suplente: "Ramiro Mamani Ramirez", slugSuplente: generarSlug("Ramiro Mamani Ramirez"),
    fotoSuplente: "/senadores/suplentes/g2/RAMIRO MAMANI RAMIREZ.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 34, seatNumber: 34, name: "Freddy Castillo Chávez", slug: generarSlug("Freddy Castillo Chávez"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "La Paz",
    foto: "/senadores/titulares/g2/FREDDY CASTILLO CHAVEZ.png",
    suplente: "Villma Colque Camacho", slugSuplente: generarSlug("Villma Colque Camacho"),
    fotoSuplente: "/senadores/suplentes/g2/VILLMA COLQUE CAMACHO.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 35, seatNumber: 35, name: "Maria Antonieta Alcón Sánchez", slug: generarSlug("Maria Antonieta Alcón Sánchez"), tipo: 'titular',
    party: "Partido Demócrata Cristiano", partyShort: "PDC", partyColor: "#2E7078", department: "La Paz",
    foto: "/senadores/titulares/g2/MARIA ANTONIETA ALCON SANCHEZ.png",
    suplente: "Edwin Lopez Quiroga", slugSuplente: generarSlug("Edwin Lopez Quiroga"),
    fotoSuplente: "/senadores/suplentes/g2/EDWIN LOPEZ QUIROGA.png",
    cargoSuplente: "Senador Suplente"
  },
  { 
    id: 36, seatNumber: 36, name: "José Sánchez Aguilar", slug: generarSlug("José Sánchez Aguilar"), tipo: 'titular',
    party: "Libre", partyShort: "LIBRE", partyColor: "#DB3737", department: "Cochabamba",
    foto: "/senadores/titulares/g2/JOSE SANCHEZ AGUILAR.png",
    suplente: "Cinthya Inga Gutierrez Guzman", slugSuplente: generarSlug("Cinthya Inga Gutierrez Guzman"),
    fotoSuplente: "/senadores/suplentes/g2/CINTHYA INGA GUTIERREZ GUZMAN.png",
    cargoSuplente: "Senador Suplente"
  }
];

// ============================================
// 🔥 DATA DE COMISIONES Y COMITÉS
// ============================================
const COMISIONES_DATA = [
  {
    nombre: 'Comisión de Constitución, Derechos Humanos, Legislación y Sistema Electoral',
    presidenteId: 28,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE CONSTITUCIÓN, LEGISLACIÓN E INTERPRETACIÓN LEGISLATIVA Y CONSTITUCIONAL', secretarioId: 34, cargoSecretario: 'SECRETARIO DE COMITÉ' },
      { nombre: 'COMITÉ DE SISTEMA ELECTORAL, DERECHOS HUMANOS Y EQUIDAD SOCIAL', secretarioId: 8, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Justicia Plural, Ministerio Público y Defensa Legal del Estado',
    presidenteId: 19,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE JUSTICIA PLURAL Y CONSEJO DE LA MAGISTRATURA', secretarioId: 1, cargoSecretario: 'SECRETARIO DE COMITÉ' },
      { nombre: 'COMITÉ DE MINISTERIO PÚBLICO Y DEFENSA LEGAL DEL ESTADO', secretarioId: 29, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Seguridad del Estado, Fuerzas Armadas y Policía Boliviana',
    presidenteId: 2,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE FUERZAS ARMADAS Y POLICÍA BOLIVIANA', secretarioId: 21, cargoSecretario: 'SECRETARIA DE COMITÉ' },
      { nombre: 'COMITÉ DE SEGURIDAD DEL ESTADO Y LUCHA CONTRA EL NARCOTRÁFICO', secretarioId: 14, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Organización Territorial del Estado y Autonomías',
    presidenteId: 30,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE AUTONOMÍAS MUNICIPALES, INDÍGENA ORIGINARIO CAMPESINAS Y REGIONALES', secretarioId: 20, cargoSecretario: 'SECRETARIO DE COMITÉ' },
      { nombre: 'COMITÉ DE AUTONOMÍAS DEPARTAMENTALES', secretarioId: 22, cargoSecretario: 'SECRETARIO DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Planificación, Política Económica y Finanzas',
    presidenteId: 27,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE PLANIFICACIÓN, PRESUPUESTO, INVERSIÓN PÚBLICA Y CONTRALORÍA GENERAL DEL ESTADO', secretarioId: 31, cargoSecretario: 'SECRETARIA DE COMITÉ' },
      { nombre: 'COMITÉ DE POLÍTICAS FINANCIERA, MONETARIA, TRIBUTARIA Y SEGUROS', secretarioId: 9, cargoSecretario: 'SECRETARIO DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Economía Plural, Producción, Industria e Industrialización',
    presidenteId: 23,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE ENERGÍA, HIDROCARBUROS, MINERÍA Y METALURGIA', secretarioId: 17, cargoSecretario: 'SECRETARIO DE COMITÉ' },
      { nombre: 'COMITÉ DE ECONOMÍA PLURAL, DESARROLLO PRODUCTIVO, OBRAS PÚBLICAS E INFRAESTRUCTURA', secretarioId: 15, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Naciones y Pueblos Indígena Originario Campesinos e Interculturalidad',
    presidenteId: 5,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE NACIONES Y PUEBLOS INDÍGENA ORIGINARIO CAMPESINOS', secretarioId: 18, cargoSecretario: 'SECRETARIA DE COMITÉ' },
      { nombre: 'COMITÉ DE CULTURAS, INTERCULTURALIDAD Y PATRIMONIO CULTURAL', secretarioId: 10, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Política Social, Educación y Salud',
    presidenteId: 36,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE EDUCACIÓN, SALUD, CIENCIA, TECNOLOGÍA Y DEPORTES', secretarioId: 35, cargoSecretario: 'SECRETARIA DE COMITÉ' },
      { nombre: 'COMITÉ DE VIVIENDA, RÉGIMEN LABORAL, SEGURIDAD INDUSTRIAL Y SEGURIDAD SOCIAL', secretarioId: 3, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Política Internacional',
    presidenteId: 7,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE ASUNTOS EXTERIORES, INTERPARLAMENTARIOS Y ORGANISMOS INTERNACIONALES', secretarioId: 16, cargoSecretario: 'SECRETARIA DE COMITÉ' },
      { nombre: 'COMITÉ DE RELACIONES ECONÓMICAS INTERNACIONALES', secretarioId: 4, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  },
  {
    nombre: 'Comisión de Tierra y Territorio, Recursos Naturales y Medio Ambiente',
    presidenteId: 11,
    cargoPresidente: 'PRESIDENTE DE COMISIÓN',
    comites: [
      { nombre: 'COMITÉ DE TIERRA Y TERRITORIO, RECURSOS NATURALES Y HOJA DE LA COCA', secretarioId: 25, cargoSecretario: 'SECRETARIA DE COMITÉ' },
      { nombre: 'COMITÉ DE MEDIO AMBIENTE, BIODIVERSIDAD, AMAZONÍA, ÁREAS PROTEGIDAS Y CAMBIO CLIMÁTICO', secretarioId: 26, cargoSecretario: 'SECRETARIA DE COMITÉ' }
    ]
  }
];

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function seedAll() {
  console.log('\n' + '═'.repeat(80));
  console.log('🌱 SEED COMPLETO - SENADORES + COMISIONES');
  console.log('   ✅ Titulares con sus suplentes');
  console.log('   ✅ Fotos de suplentes incluidas');
  console.log('   ✅ Comisiones y comités');
  console.log('   ✅ Cargos correctos');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    const force = process.argv.includes('--force');

    // ============================================
    // 1. SENADORES
    // ============================================
    const senadoresCount = await Senador.countDocuments();
    if (senadoresCount > 0) {
      if (!force) {
        console.log(`⚠️ Ya existen ${senadoresCount} senadores.`);
        console.log('   Usa --force para sobrescribir: node src/scripts/seedAll.js --force');
        process.exit(0);
      }
      console.log('🗑️ Eliminando senadores existentes...');
      await Senador.deleteMany({});
      console.log('✅ Eliminados\n');
    }

    console.log(`📝 Insertando ${SENADORES_DATA.length} senadores...\n`);
    
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < SENADORES_DATA.length; i += batchSize) {
      const batch = SENADORES_DATA.slice(i, i + batchSize);
      await Senador.insertMany(batch, { ordered: false });
      inserted += batch.length;
      console.log(`   ✅ Insertados ${inserted} de ${SENADORES_DATA.length}`);
    }

    console.log(`\n✅ ${inserted} senadores insertados exitosamente`);

    const suplentesConFoto = await Senador.countDocuments({ fotoSuplente: { $ne: null, $ne: '' } });
    console.log(`   📸 Suplentes con foto: ${suplentesConFoto}`);

    // ============================================
    // 2. ACTUALIZAR CARGOS DE SENADORES
    // ============================================
    console.log('\n🔄 Actualizando cargos de senadores...\n');

    const updates = [];
    COMISIONES_DATA.forEach(comision => {
      updates.push({ id: comision.presidenteId, cargo: comision.cargoPresidente });
      comision.comites.forEach(comite => {
        updates.push({ id: comite.secretarioId, cargo: comite.cargoSecretario });
      });
    });

    let cargosActualizados = 0;
    for (const update of updates) {
      const result = await Senador.updateOne(
        { id: update.id },
        { $set: { cargo: update.cargo } }
      );
      if (result.modifiedCount > 0) {
        cargosActualizados++;
        console.log(`   ✅ Senador ID ${update.id} → "${update.cargo}"`);
      }
    }

    console.log(`\n✅ ${cargosActualizados} cargos actualizados`);

    // ============================================
    // 3. COMISIONES
    // ============================================
    const comisionesCount = await Comision.countDocuments();
    if (comisionesCount > 0) {
      if (!force) {
        console.log(`⚠️ Ya existen ${comisionesCount} comisiones.`);
        console.log('   Usa --force para sobrescribir');
        process.exit(0);
      }
      console.log('🗑️ Eliminando comisiones existentes...');
      await Comision.deleteMany({});
      console.log('✅ Eliminados\n');
    }

    console.log(`📝 Insertando ${COMISIONES_DATA.length} comisiones...\n`);
    
    await Comision.insertMany(COMISIONES_DATA);
    console.log(`✅ ${COMISIONES_DATA.length} comisiones insertadas`);

    // ============================================
    // 4. RESUMEN FINAL
    // ============================================
    const totalSenadores = await Senador.countDocuments();
    const totalComisiones = await Comision.countDocuments();
    const suplentesConFotoFinal = await Senador.countDocuments({ fotoSuplente: { $ne: null, $ne: '' } });
    const senadoresConCargo = await Senador.countDocuments({ cargo: { $ne: 'Senador', $ne: null } });

    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMEN FINAL');
    console.log('═'.repeat(80));
    console.log(`   👥 Senadores: ${totalSenadores}`);
    console.log(`   📸 Suplentes con foto: ${suplentesConFotoFinal}`);
    console.log(`   📋 Senadores con cargo especial: ${senadoresConCargo}`);
    console.log(`   📋 Comisiones: ${totalComisiones}`);
    
    const comisionesConComites = await Comision.find().lean();
    let totalComites = 0;
    comisionesConComites.forEach(c => { totalComites += c.comites?.length || 0; });
    console.log(`   📋 Comités: ${totalComites}`);

    console.log('\n📋 Muestra de senadores:');
    const muestra = await Senador.find().limit(5).lean();
    muestra.forEach((s, i) => {
      console.log(`   ${i+1}. ${s.name} (${s.partyShort})`);
      if (s.suplente) {
        console.log(`      Suplente: ${s.suplente} → ${s.fotoSuplente ? '✅ con foto' : '❌ sin foto'}`);
      }
    });

    console.log('\n📋 Muestra de comisiones:');
    const muestraComisiones = await Comision.find().limit(3).lean();
    muestraComisiones.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.nombre} → ${c.comites?.length || 0} comités`);
    });

    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEED COMPLETADO CON ÉXITO');
    console.log('   ✅ Todos los datos cargados correctamente');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedAll();