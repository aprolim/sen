// src/scripts/seedSenadores.js
// Script para migrar los datos de senadores a MongoDB
// LA DATA ESTÁ INCLUIDA AQUÍ

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Senador = require('../models/Senador');

dotenv.config();

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
// 🔥 DATA COMPLETA DE SENADORES (71 senadores)
// ============================================
const SENADORES_DATA = [
  // ============================================
  // SENADORES TITULARES (36)
  // ============================================
  { 
    id: 1, 
    seatNumber: 1, 
    name: "Wilder Véliz Armas", 
    slug: generarSlug("Wilder Véliz Armas"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g1/WILDER VELIZ ARMAS.png"
  },
  { 
    id: 2, 
    seatNumber: 2, 
    name: "Judith Rosario García Coca", 
    slug: generarSlug("Judith Rosario García Coca"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Potosí",
    foto: "/senadores/titulares/g1/JUDITH ROSARIO GARCIA COCA.png"
  },
  { 
    id: 3, 
    seatNumber: 3, 
    name: "Claudia Mallón Vargas", 
    slug: generarSlug("Claudia Mallón Vargas"),
    tipo: 'titular',
    party: "Autonomía para Bolivia Súmate", 
    partyShort: "APB", 
    partyColor: "#611789", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g1/CLAUDIA MALLON VARGAS.png"
  },
  { 
    id: 4, 
    seatNumber: 4, 
    name: "Wanda Ximena Medrano Hervas", 
    slug: generarSlug("Wanda Ximena Medrano Hervas"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g1/WANDA XIMENA MEDRANO HERVAS.png"
  },
  { 
    id: 5, 
    seatNumber: 5, 
    name: "José Manuel Ormachea Mendieta", 
    slug: generarSlug("José Manuel Ormachea Mendieta"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "La Paz",
    foto: "/senadores/titulares/g1/JOSE MANUEL ORMACHEA MENDIETA.png"
  },
  { 
    id: 6, 
    seatNumber: 6, 
    name: "Carmen Soledad Chapeton Tancara", 
    slug: generarSlug("Carmen Soledad Chapeton Tancara"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "La Paz",
    foto: "/senadores/titulares/g1/CARMEN SOLEDAD CHAPETÓN TANCARA.png"
  },
  { 
    id: 7, 
    seatNumber: 7, 
    name: "Nicanor Gonzalo Cochi Condorí", 
    slug: generarSlug("Nicanor Gonzalo Cochi Condorí"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/titulares/g1/NICANOR GONZALO COCHI CONDORI.png"
  },
  { 
    id: 8, 
    seatNumber: 8, 
    name: "Tomasa Yarhui Jacome", 
    slug: generarSlug("Tomasa Yarhui Jacome"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Chuquisaca",
    foto: "/senadores/titulares/g1/TOMASA YARHUI JACOME.png"
  },
  { 
    id: 9, 
    seatNumber: 9, 
    name: "Abdon Porcel Arancibia", 
    slug: generarSlug("Abdon Porcel Arancibia"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Chuquisaca",
    foto: "/senadores/titulares/g1/ABDON PORCEL ARANCIBIA.png"
  },
  { 
    id: 10, 
    seatNumber: 10, 
    name: "Bertha Cartagena Sánchez", 
    slug: generarSlug("Bertha Cartagena Sánchez"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Chuquisaca",
    foto: "/senadores/titulares/g1/BERTHA CARTAGENA SANCHEZ.png"
  },
  { 
    id: 11, 
    seatNumber: 11, 
    name: "Branko Goran Marinković Jovicevic", 
    slug: generarSlug("Branko Goran Marinković Jovicevic"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Santa Cruz",
    foto: "/senadores/titulares/g3/BRANKO GORAN MARINKOVIC JOVICEVIC.png"
  },
  { 
    id: 12, 
    seatNumber: 12, 
    name: "Kathia Lizbeth Quiroga Fernández", 
    slug: generarSlug("Kathia Lizbeth Quiroga Fernández"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Santa Cruz",
    foto: "/senadores/titulares/g3/KATHIA LISBETH QUIROGA FERNÁNDEZ.png"
  },
  { 
    id: 13, 
    seatNumber: 13, 
    name: "Rosa Tatiana Áñez Carrasco", 
    slug: generarSlug("Rosa Tatiana Áñez Carrasco"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Santa Cruz",
    foto: "/senadores/titulares/g3/ROSA TATIANA AÑEZ CARRASCO.png"
  },
  { 
    id: 14, 
    seatNumber: 14, 
    name: "Paola Limbania López Zeballos", 
    slug: generarSlug("Paola Limbania López Zeballos"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g3/PAOLA LIMBANIA LOPEZ ZEBALLOS.png"
  },
  { 
    id: 15, 
    seatNumber: 15, 
    name: "Betty Canaviri Villanueva", 
    slug: generarSlug("Betty Canaviri Villanueva"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Potosí",
    foto: "/senadores/titulares/g2/BETTY CANAVIRI VILLANUEVA.png"
  },
  { 
    id: 16, 
    seatNumber: 16, 
    name: "Teresa Alarcón Arana", 
    slug: generarSlug("Teresa Alarcón Arana"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Potosí",
    foto: "/senadores/titulares/g2/TERESA ALARCON ARANA.png"
  },
  { 
    id: 17, 
    seatNumber: 17, 
    name: "Marcelino Flores Ordoñez", 
    slug: generarSlug("Marcelino Flores Ordoñez"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Potosí",
    foto: "/senadores/titulares/g2/MARCELINO FLORES ORDOÑEZ.png"
  },
  { 
    id: 18, 
    seatNumber: 18, 
    name: "Bertha Nurmy Gutiérrez Meneses", 
    slug: generarSlug("Bertha Nurmy Gutiérrez Meneses"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Potosí",
    foto: "/senadores/titulares/g2/BERTHA NURMY GUTIERREZ MENESES.png"
  },
  { 
    id: 19, 
    seatNumber: 19, 
    name: "Erick Nelson Soruco Alpire", 
    slug: generarSlug("Erick Nelson Soruco Alpire"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Beni",
    foto: "/senadores/titulares/g3/ERICK NELSON SORUCO ALPIRE.png"
  },
  { 
    id: 20, 
    seatNumber: 20, 
    name: "José Roca Haensel", 
    slug: generarSlug("José Roca Haensel"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Beni",
    foto: "/senadores/titulares/g3/JOSE ROCA HAENSEL.png"
  },
  { 
    id: 21, 
    seatNumber: 21, 
    name: "Ana Karina Velasco Añez", 
    slug: generarSlug("Ana Karina Velasco Añez"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Beni",
    foto: "/senadores/titulares/g3/ANA KARINA VELASCO ÁÑEZ.png"
  },
  { 
    id: 22, 
    seatNumber: 22, 
    name: "Ernesto Suarez Sattori", 
    slug: generarSlug("Ernesto Suarez Sattori"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g3/ERNESTO SUAREZ SATTORI.png"
  },
  { 
    id: 23, 
    seatNumber: 23, 
    name: "Ana María Crispin Choque", 
    slug: generarSlug("Ana María Crispin Choque"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/titulares/g1/ANA MARIA CRISPIN CHOQUE.png"
  },
  { 
    id: 24, 
    seatNumber: 24, 
    name: "Julio Diego Romaña Galindo", 
    slug: generarSlug("Julio Diego Romaña Galindo"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Pando",
    foto: "/senadores/titulares/g3/JULIO DIEGO ROMAÑA GALINDO.png"
  },
  { 
    id: 25, 
    seatNumber: 25, 
    name: "Carol Carlo Durán", 
    slug: generarSlug("Carol Carlo Durán"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Pando",
    foto: "/senadores/titulares/g3/CAROL CARLO DURAN.png"
  },
  { 
    id: 26, 
    seatNumber: 26, 
    name: "Cintia Monica Puerta Campos", 
    slug: generarSlug("Cintia Monica Puerta Campos"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Pando",
    foto: "/senadores/titulares/g3/CINTIA MONICA PUERTA CAMPOS.png"
  },
  { 
    id: 27, 
    seatNumber: 27, 
    name: "Eliana Rina Acosta Quispe", 
    slug: generarSlug("Eliana Rina Acosta Quispe"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g3/ELIANA RINA ACOSTA QUISPE.png"
  },
  { 
    id: 28, 
    seatNumber: 28, 
    name: "Daniel Antonio Ortiz Velásquez", 
    slug: generarSlug("Daniel Antonio Ortiz Velásquez"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/titulares/g1/DANIEL ANTONIO ORTIZ VELASQUEZ.png"
  },
  { 
    id: 29, 
    seatNumber: 29, 
    name: "María Isabel Moreno Cortez", 
    slug: generarSlug("María Isabel Moreno Cortez"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Tarija",
    foto: "/senadores/titulares/g2/MARIA ISABEL MORENO CORTEZ.png"
  },
  { 
    id: 30, 
    seatNumber: 30, 
    name: "César Mentasti Padilla", 
    slug: generarSlug("César Mentasti Padilla"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Tarija",
    foto: "/senadores/titulares/g2/CESAR MENTASTI PADILLA.png"
  },
  { 
    id: 31, 
    seatNumber: 31, 
    name: "Leonor Rosalva Romero Gutiérrez", 
    slug: generarSlug("Leonor Rosalva Romero Gutiérrez"),
    tipo: 'titular',
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Tarija",
    foto: "/senadores/titulares/g2/LEONOR ROSALVA ROMERO GUTIERREZ.png"
  },
  { 
    id: 32, 
    seatNumber: 32, 
    name: "Diego Esteban Mateo Ávila Navajas", 
    slug: generarSlug("Diego Esteban Mateo Ávila Navajas"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Tarija",
    foto: "/senadores/titulares/g2/DIEGO ESTEBAN MATEO ÁVILA NAVAJAS.png"
  },
  { 
    id: 33, 
    seatNumber: 33, 
    name: "Yasmín Estivariz Villarroel", 
    slug: generarSlug("Yasmín Estivariz Villarroel"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Oruro",
    foto: "/senadores/titulares/g2/YASMIN ESTIVARIZ VILLARROEL.png"
  },
  { 
    id: 34, 
    seatNumber: 34, 
    name: "Freddy Castillo Chávez", 
    slug: generarSlug("Freddy Castillo Chávez"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/titulares/g2/FREDDY CASTILLO CHAVEZ.png"
  },
  { 
    id: 35, 
    seatNumber: 35, 
    name: "Maria Antonieta Alcón Sánchez", 
    slug: generarSlug("Maria Antonieta Alcón Sánchez"),
    tipo: 'titular',
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/titulares/g2/MARIA ANTONIETA ALCON SANCHEZ.png"
  },
  { 
    id: 36, 
    seatNumber: 36, 
    name: "José Sánchez Aguilar", 
    slug: generarSlug("José Sánchez Aguilar"),
    tipo: 'titular',
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Cochabamba",
    foto: "/senadores/titulares/g2/JOSE SANCHEZ AGUILAR.png"
  },

  // ============================================
  // SENADORES SUPLENTES (35)
  // ============================================
  { 
    id: 101, 
    seatNumber: 1, 
    name: "Lenny Mayra Ayala Justiniano", 
    slug: generarSlug("Lenny Mayra Ayala Justiniano"),
    tipo: 'suplente',
    titular: "Wilder Véliz Armas",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Cochabamba",
    foto: "/senadores/suplentes/g1/LENNY MAYRA AYALA JUSTINIANO.png"
  },
  { 
    id: 102, 
    seatNumber: 2, 
    name: "Royer Ivan Mamani Garcia", 
    slug: generarSlug("Royer Ivan Mamani Garcia"),
    tipo: 'suplente',
    titular: "Judith Rosario García Coca",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Cochabamba",
    foto: "/senadores/suplentes/g1/ROYER IVAN MAMANI GARCIA.png"
  },
  { 
    id: 103, 
    seatNumber: 3, 
    name: "Apolinar Rivera Muñoz", 
    slug: generarSlug("Apolinar Rivera Muñoz"),
    tipo: 'suplente',
    titular: "Claudia Mallón Vargas",
    party: "Autonomía para Bolivia Súmate", 
    partyShort: "APB", 
    partyColor: "#611789", 
    department: "Cochabamba",
    foto: "/senadores/suplentes/g1/APOLINAR RIVERA MUÑOZ.png"
  },
  { 
    id: 104, 
    seatNumber: 4, 
    name: "Aldo Sergio Villegas Mora", 
    slug: generarSlug("Aldo Sergio Villegas Mora"),
    tipo: 'suplente',
    titular: "Wanda Ximena Medrano Hervas",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Cochabamba",
    foto: "/senadores/suplentes/g1/ALDO SERGIO VILLEGAS MORA.png"
  },
  { 
    id: 105, 
    seatNumber: 5, 
    name: "Maria Elena Pachacute Ticona", 
    slug: generarSlug("Maria Elena Pachacute Ticona"),
    tipo: 'suplente',
    titular: "José Manuel Ormachea Mendieta",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "La Paz",
    foto: "/senadores/suplentes/g1/MARIA ELENA PACHACUTE TICONA.png"
  },
  { 
    id: 106, 
    seatNumber: 6, 
    name: "Nilton Condori Alanoca", 
    slug: generarSlug("Nilton Condori Alanoca"),
    tipo: 'suplente',
    titular: "Carmen Soledad Chapeton Tancara",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "La Paz",
    foto: "/senadores/suplentes/g1/NILTON CONDORI ALANOCA.png"
  },
  { 
    id: 107, 
    seatNumber: 7, 
    name: "Roxana Mamani Colquehuanca", 
    slug: generarSlug("Roxana Mamani Colquehuanca"),
    tipo: 'suplente',
    titular: "Nicanor Gonzalo Cochi Condorí",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/suplentes/g1/ROXANA MAMANI COLQUEHUANCA.png"
  },
  { 
    id: 108, 
    seatNumber: 8, 
    name: "Hugo Marcelo Cortez Calvimontes", 
    slug: generarSlug("Hugo Marcelo Cortez Calvimontes"),
    tipo: 'suplente',
    titular: "Tomasa Yarhui Jacome",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Chuquisaca",
    foto: "/senadores/suplentes/g1/HUGO MARCELO CORTEZ CALVIMONTES.png"
  },
  { 
    id: 109, 
    seatNumber: 9, 
    name: "Ilse Fatima Davila Arancibia", 
    slug: generarSlug("Ilse Fatima Davila Arancibia"),
    tipo: 'suplente',
    titular: "Abdon Porcel Arancibia",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Chuquisaca",
    foto: "/senadores/suplentes/g1/ILSE FATIMA DAVILA ARANCIBIA.png"
  },
  { 
    id: 110, 
    seatNumber: 10, 
    name: "Manfred Leo Perez Hassenteufel", 
    slug: generarSlug("Manfred Leo Perez Hassenteufel"),
    tipo: 'suplente',
    titular: "Bertha Cartagena Sánchez",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Chuquisaca",
    foto: "/senadores/suplentes/g1/MANFRED LEO PEREZ HASSENTEUFEL.png"
  },
  { 
    id: 111, 
    seatNumber: 11, 
    name: "Kathia Natalia Miserendino Romero", 
    slug: generarSlug("Kathia Natalia Miserendino Romero"),
    tipo: 'suplente',
    titular: "Branko Goran Marinković Jovicevic",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Santa Cruz",
    foto: "/senadores/suplentes/g3/KATHIA NATALIA MISERENDINO ROMERO.png"
  },
  { 
    id: 112, 
    seatNumber: 12, 
    name: "Leonardo Roca Eguez", 
    slug: generarSlug("Leonardo Roca Eguez"),
    tipo: 'suplente',
    titular: "Kathia Lizbeth Quiroga Fernández",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Santa Cruz",
    foto: "/senadores/suplentes/g3/LEONARDO ROCA EGUEZ.png"
  },
  { 
    id: 113, 
    seatNumber: 13, 
    name: "Lorgio Fernando Pareja Saucedo", 
    slug: generarSlug("Lorgio Fernando Pareja Saucedo"),
    tipo: 'suplente',
    titular: "Rosa Tatiana Áñez Carrasco",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Santa Cruz",
    foto: "/senadores/suplentes/g3/LORGIO FERNANDO PAREJA SAUCEDO.png"
  },
  { 
    id: 114, 
    seatNumber: 14, 
    name: "Richard Espada Ugarte", 
    slug: generarSlug("Richard Espada Ugarte"),
    tipo: 'suplente',
    titular: "Paola Limbania López Zeballos",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Santa Cruz",
    foto: "/senadores/suplentes/g3/RICHARD ESPADA UGARTE.png"
  },
  { 
    id: 115, 
    seatNumber: 15, 
    name: "Roger Mamani Coronado", 
    slug: generarSlug("Roger Mamani Coronado"),
    tipo: 'suplente',
    titular: "Betty Canaviri Villanueva",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Potosí",
    foto: "/senadores/suplentes/g2/ROGER MAMANI CORONADO.png"
  },
  { 
    id: 116, 
    seatNumber: 17, 
    name: "Susana Gabriela Ruiz Zuleta", 
    slug: generarSlug("Susana Gabriela Ruiz Zuleta"),
    tipo: 'suplente',
    titular: "Marcelino Flores Ordoñez",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Potosí",
    foto: "/senadores/suplentes/g2/SUSANA GABRIELA RUIZ ZULETA.png"
  },
  { 
    id: 117, 
    seatNumber: 18, 
    name: "Freddy Rioja Melgar", 
    slug: generarSlug("Freddy Rioja Melgar"),
    tipo: 'suplente',
    titular: "Bertha Nurmy Gutiérrez Meneses",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Potosí",
    foto: "/senadores/suplentes/g2/FREDDY RIOJA MELGAR.png"
  },
  { 
    id: 118, 
    seatNumber: 19, 
    name: "Cesia Roca Escalante", 
    slug: generarSlug("Cesia Roca Escalante"),
    tipo: 'suplente',
    titular: "Erick Nelson Soruco Alpire",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Beni",
    foto: "/senadores/suplentes/g3/CESIA ROCA ESCALANTE.png"
  },
  { 
    id: 119, 
    seatNumber: 20, 
    name: "Mabel Giordano Sonnenschein", 
    slug: generarSlug("Mabel Giordano Sonnenschein"),
    tipo: 'suplente',
    titular: "José Roca Haensel",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Beni",
    foto: "/senadores/suplentes/g3/MABEL GIORDANO SONNENSCHEIN.png"
  },
  { 
    id: 120, 
    seatNumber: 21, 
    name: "Marcelo Matias Cardona Ibañez", 
    slug: generarSlug("Marcelo Matias Cardona Ibañez"),
    tipo: 'suplente',
    titular: "Ana Karina Velasco Añez",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Beni",
    foto: "/senadores/suplentes/g3/MARCELO MATIAS CARDONA IBAÑEZ.png"
  },
  { 
    id: 121, 
    seatNumber: 22, 
    name: "Claudia Cardenas Velasquez", 
    slug: generarSlug("Claudia Cardenas Velasquez"),
    tipo: 'suplente',
    titular: "Ernesto Suarez Sattori",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Beni",
    foto: "/senadores/suplentes/g3/CLAUDIA CARDENAS VELASQUEZ.png"
  },
  { 
    id: 122, 
    seatNumber: 23, 
    name: "Victor Severo Quispe Santander", 
    slug: generarSlug("Victor Severo Quispe Santander"),
    tipo: 'suplente',
    titular: "Ana María Crispin Choque",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/suplentes/g1/VICTOR SEVERO QUISPE SANTANDER.png"
  },
  { 
    id: 123, 
    seatNumber: 24, 
    name: "Carolina Giese Urresti", 
    slug: generarSlug("Carolina Giese Urresti"),
    tipo: 'suplente',
    titular: "Julio Diego Romaña Galindo",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Pando",
    foto: "/senadores/suplentes/g3/CAROLINA GIESE URRESTI.png"
  },
  { 
    id: 124, 
    seatNumber: 25, 
    name: "Jorge Antonio Quispe Flores", 
    slug: generarSlug("Jorge Antonio Quispe Flores"),
    tipo: 'suplente',
    titular: "Carol Carlo Durán",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Pando",
    foto: "/senadores/suplentes/g3/JORGE ANTONIO QUISPE FLORES.png"
  },
  { 
    id: 125, 
    seatNumber: 26, 
    name: "Jesus Humberto Suarez Eguez", 
    slug: generarSlug("Jesus Humberto Suarez Eguez"),
    tipo: 'suplente',
    titular: "Cintia Monica Puerta Campos",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Pando",
    foto: "/senadores/suplentes/g3/JESUS HUMBERTO SUAREZ EGUEZ.png"
  },
  { 
    id: 126, 
    seatNumber: 27, 
    name: "Sichard Hans Soraide Castedo", 
    slug: generarSlug("Sichard Hans Soraide Castedo"),
    tipo: 'suplente',
    titular: "Eliana Rina Acosta Quispe",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Cochabamba",
    foto: "/senadores/suplentes/g3/SICHARD HANS SORAIDE CASTEDO.png"
  },
  { 
    id: 127, 
    seatNumber: 28, 
    name: "Reina Isabel Pallares Morales", 
    slug: generarSlug("Reina Isabel Pallares Morales"),
    tipo: 'suplente',
    titular: "Daniel Antonio Ortiz Velásquez",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/suplentes/g1/REINA ISABEL PALLARES MORALES.png"
  },
  { 
    id: 128, 
    seatNumber: 29, 
    name: "Rolando Vacaflor Gabriel Arana", 
    slug: generarSlug("Rolando Vacaflor Gabriel Arana"),
    tipo: 'suplente',
    titular: "María Isabel Moreno Cortez",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Tarija",
    foto: "/senadores/suplentes/g2/ROLANDO VACAFLOR GABRIEL ARANA.png"
  },
  { 
    id: 129, 
    seatNumber: 30, 
    name: "Marcela Guerrero Vilca", 
    slug: generarSlug("Marcela Guerrero Vilca"),
    tipo: 'suplente',
    titular: "César Mentasti Padilla",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Tarija",
    foto: "/senadores/suplentes/g2/MARCELA GUERRERO VILCA.png"
  },
  { 
    id: 130, 
    seatNumber: 31, 
    name: "Marco Antonio Segovia Vargas", 
    slug: generarSlug("Marco Antonio Segovia Vargas"),
    tipo: 'suplente',
    titular: "Leonor Rosalva Romero Gutiérrez",
    party: "Unidad", 
    partyShort: "UNIDAD", 
    partyColor: "#EFCD04", 
    department: "Tarija",
    foto: "/senadores/suplentes/g2/MARCO ANTONIO SEGOVIA VARGAS.png"
  },
  { 
    id: 131, 
    seatNumber: 32, 
    name: "Luzmaya Zelaya Vega", 
    slug: generarSlug("Luzmaya Zelaya Vega"),
    tipo: 'suplente',
    titular: "Diego Esteban Mateo Ávila Navajas",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Tarija",
    foto: "/senadores/suplentes/g2/LUZMAYA ZELAYA VEGA.png"
  },
  { 
    id: 132, 
    seatNumber: 33, 
    name: "Ramiro Mamani Ramirez", 
    slug: generarSlug("Ramiro Mamani Ramirez"),
    tipo: 'suplente',
    titular: "Yasmín Estivariz Villarroel",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "Oruro",
    foto: "/senadores/suplentes/g2/RAMIRO MAMANI RAMIREZ.png"
  },
  { 
    id: 133, 
    seatNumber: 34, 
    name: "Villma Colque Camacho", 
    slug: generarSlug("Villma Colque Camacho"),
    tipo: 'suplente',
    titular: "Freddy Castillo Chávez",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/suplentes/g2/VILLMA COLQUE CAMACHO.png"
  },
  { 
    id: 134, 
    seatNumber: 35, 
    name: "Edwin Lopez Quiroga", 
    slug: generarSlug("Edwin Lopez Quiroga"),
    tipo: 'suplente',
    titular: "Maria Antonieta Alcón Sánchez",
    party: "Partido Demócrata Cristiano", 
    partyShort: "PDC", 
    partyColor: "#2E7078", 
    department: "La Paz",
    foto: "/senadores/suplentes/g2/EDWIN LOPEZ QUIROGA.png"
  },
  { 
    id: 135, 
    seatNumber: 36, 
    name: "Cinthya Inga Gutierrez Guzman", 
    slug: generarSlug("Cinthya Inga Gutierrez Guzman"),
    tipo: 'suplente',
    titular: "José Sánchez Aguilar",
    party: "Libre", 
    partyShort: "LIBRE", 
    partyColor: "#DB3737", 
    department: "Cochabamba",
    foto: "/senadores/suplentes/g2/CINTHYA INGA GUTIERREZ GUZMAN.png"
  }
];

// ============================================
// SCRIPT PRINCIPAL
// ============================================
async function seedSenadores() {
  console.log('\n' + '═'.repeat(80));
  console.log('👥 SEED DE SENADORES');
  console.log('   Migrando datos a MongoDB');
  console.log('═'.repeat(80) + '\n');

  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/senado_bolivia');
    console.log('✅ Conectado a MongoDB\n');

    // Verificar si ya hay datos
    const existingCount = await Senador.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Ya existen ${existingCount} senadores en la base de datos.`);
      const force = process.argv.includes('--force');
      
      if (!force) {
        console.log('   Usa --force para sobrescribir: node src/scripts/seedSenadores.js --force');
        console.log('❌ Operación cancelada.');
        process.exit(0);
      }
      
      console.log('🗑️ Eliminando senadores existentes...');
      await Senador.deleteMany({});
      console.log('✅ Eliminados\n');
    }

    console.log(`📝 Preparando ${SENADORES_DATA.length} senadores para insertar...\n`);

    // Insertar en lotes
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < SENADORES_DATA.length; i += batchSize) {
      const batch = SENADORES_DATA.slice(i, i + batchSize);
      await Senador.insertMany(batch, { ordered: false });
      inserted += batch.length;
      console.log(`   ✅ Insertados ${inserted} de ${SENADORES_DATA.length} senadores...`);
    }

    console.log(`\n✅ ${inserted} senadores insertados exitosamente`);

    // Verificar
    const total = await Senador.countDocuments();
    console.log(`\n📊 Total en base de datos: ${total} senadores`);

    // Mostrar primeros 5
    const sample = await Senador.find().limit(5).lean();
    console.log('\n📋 Muestra de los primeros 5:');
    sample.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.partyShort}) - ${s.department}`);
    });

    await mongoose.disconnect();
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 SEED COMPLETADO CON ÉXITO');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedSenadores();