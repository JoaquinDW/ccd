// Divisiones de primer nivel (provincia / estado / departamento / región) por país.
// En los formularios de carga (`components/location-fields.tsx`) Argentina se resuelve
// contra la API de Georef (apis.datos.gob.ar), que también trae localidades; el listado
// estático de acá se usa para poblar filtros sin depender de la red.
// Si un país no figura en este mapa, el campo se completa como texto libre.

export const SUBDIVISIONES: Record<string, string[]> = {
  Alemania: [
    'Baden-Wurtemberg', 'Baja Sajonia', 'Baviera', 'Berlín', 'Brandeburgo', 'Bremen',
    'Hamburgo', 'Hesse', 'Mecklemburgo-Pomerania Occidental', 'Renania del Norte-Westfalia',
    'Renania-Palatinado', 'Sajonia', 'Sajonia-Anhalt', 'Sarre', 'Schleswig-Holstein', 'Turingia',
  ],
  // Nombres oficiales de Georef, para que coincidan con lo que guardan los formularios.
  Argentina: [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires',
    'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
    'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego, Antártida e Islas del Atlántico Sur', 'Tucumán',
  ],
  Australia: [
    'Australia Meridional', 'Australia Occidental', 'Nueva Gales del Sur', 'Queensland',
    'Tasmania', 'Territorio de la Capital Australiana', 'Territorio del Norte', 'Victoria',
  ],
  Austria: [
    'Alta Austria', 'Baja Austria', 'Burgenland', 'Carintia', 'Estiria', 'Salzburgo',
    'Tirol', 'Viena', 'Vorarlberg',
  ],
  Bélgica: [
    'Amberes', 'Bruselas-Capital', 'Brabante Flamenco', 'Brabante Valón', 'Flandes Occidental',
    'Flandes Oriental', 'Hainaut', 'Lieja', 'Limburgo', 'Luxemburgo', 'Namur',
  ],
  Bolivia: [
    'Beni', 'Chuquisaca', 'Cochabamba', 'La Paz', 'Oruro', 'Pando', 'Potosí',
    'Santa Cruz', 'Tarija',
  ],
  Brasil: [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahía', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Río de Janeiro', 'Río Grande del Norte', 'Río Grande del Sur', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
  ],
  Canadá: [
    'Alberta', 'Columbia Británica', 'Isla del Príncipe Eduardo', 'Manitoba',
    'Nueva Brunswick', 'Nueva Escocia', 'Nunavut', 'Ontario', 'Quebec',
    'Saskatchewan', 'Terranova y Labrador', 'Territorios del Noroeste', 'Yukón',
  ],
  Chile: [
    'Antofagasta', 'Araucanía', 'Arica y Parinacota', 'Atacama', 'Aysén', 'Biobío',
    'Coquimbo', 'Los Lagos', 'Los Ríos', 'Magallanes', 'Maule', 'Metropolitana de Santiago',
    'Ñuble', "O'Higgins", 'Tarapacá', 'Valparaíso',
  ],
  Colombia: [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
    'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
    'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
    'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
  ],
  'Costa Rica': [
    'Alajuela', 'Cartago', 'Guanacaste', 'Heredia', 'Limón', 'Puntarenas', 'San José',
  ],
  Cuba: [
    'Artemisa', 'Camagüey', 'Ciego de Ávila', 'Cienfuegos', 'Granma', 'Guantánamo',
    'Holguín', 'Isla de la Juventud', 'La Habana', 'Las Tunas', 'Matanzas', 'Mayabeque',
    'Pinar del Río', 'Sancti Spíritus', 'Santiago de Cuba', 'Villa Clara',
  ],
  Ecuador: [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro',
    'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí',
    'Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena',
    'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
  ],
  'El Salvador': [
    'Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad', 'La Paz',
    'La Unión', 'Morazán', 'San Miguel', 'San Salvador', 'San Vicente', 'Santa Ana',
    'Sonsonate', 'Usulután',
  ],
  España: [
    'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
    'Badajoz', 'Baleares', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
    'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada',
    'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Jaén', 'La Rioja', 'Las Palmas',
    'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra',
    'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife',
    'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
    'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
  ],
  'Estados Unidos': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Carolina del Norte',
    'Carolina del Sur', 'Colorado', 'Connecticut', 'Dakota del Norte', 'Dakota del Sur',
    'Delaware', 'Distrito de Columbia', 'Florida', 'Georgia', 'Hawái', 'Idaho', 'Illinois',
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Luisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Misisipi', 'Misuri', 'Montana', 'Nebraska',
    'Nevada', 'Nueva Jersey', 'Nueva York', 'Nuevo Hampshire', 'Nuevo México', 'Ohio',
    'Oklahoma', 'Oregón', 'Pensilvania', 'Rhode Island', 'Tennessee', 'Texas', 'Utah',
    'Vermont', 'Virginia', 'Virginia Occidental', 'Washington', 'Wisconsin', 'Wyoming',
  ],
  Francia: [
    'Alsacia-Champaña-Ardenas-Lorena', 'Aquitania-Lemosín-Poitou-Charentes', 'Auvernia-Ródano-Alpes',
    'Borgoña-Franco Condado', 'Bretaña', 'Centro-Valle de Loira', 'Córcega', 'Guadalupe',
    'Guayana Francesa', 'Isla de Francia', 'Languedoc-Rosellón-Mediodía-Pirineos', 'Martinica',
    'Mayotte', 'Normandía', 'Nueva Aquitania', 'Países del Loira', 'Provenza-Alpes-Costa Azul',
    'Reunión', 'Alta Francia', 'Occitania',
  ],
  Guatemala: [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula', 'El Progreso',
    'Escuintla', 'Guatemala', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa', 'Petén',
    'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez', 'San Marcos', 'Santa Rosa',
    'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa',
  ],
  Honduras: [
    'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso',
    'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz',
    'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro',
  ],
  Irlanda: [
    'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublín', 'Galway', 'Kerry', 'Kildare',
    'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath',
    'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
    'Wexford', 'Wicklow',
  ],
  Italia: [
    'Abruzos', 'Basilicata', 'Calabria', 'Campania', 'Cerdeña', 'Emilia-Romaña',
    'Friuli-Venecia Julia', 'Lacio', 'Liguria', 'Lombardía', 'Las Marcas', 'Molise',
    'Piamonte', 'Apulia', 'Sicilia', 'Toscana', 'Trentino-Alto Adigio', 'Umbría',
    'Valle de Aosta', 'Véneto',
  ],
  México: [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
    'Zacatecas',
  ],
  Nicaragua: [
    'Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Costa Caribe Norte', 'Costa Caribe Sur',
    'Estelí', 'Granada', 'Jinotega', 'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa',
    'Nueva Segovia', 'Río San Juan', 'Rivas',
  ],
  Panamá: [
    'Bocas del Toro', 'Chiriquí', 'Coclé', 'Colón', 'Darién', 'Emberá-Wounaán',
    'Guna Yala', 'Herrera', 'Los Santos', 'Ngäbe-Buglé', 'Panamá', 'Panamá Oeste', 'Veraguas',
  ],
  Paraguay: [
    'Alto Paraguay', 'Alto Paraná', 'Amambay', 'Asunción', 'Boquerón', 'Caaguazú',
    'Caazapá', 'Canindeyú', 'Central', 'Concepción', 'Cordillera', 'Guairá', 'Itapúa',
    'Misiones', 'Ñeembucú', 'Paraguarí', 'Presidente Hayes', 'San Pedro',
  ],
  Perú: [
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao',
    'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque',
    'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno',
    'San Martín', 'Tacna', 'Tumbes', 'Ucayali',
  ],
  Portugal: [
    'Aveiro', 'Azores', 'Beja', 'Braga', 'Braganza', 'Castelo Branco', 'Coímbra', 'Évora',
    'Faro', 'Guarda', 'Leiría', 'Lisboa', 'Madeira', 'Portalegre', 'Oporto', 'Santarém',
    'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu',
  ],
  'Reino Unido': ['Escocia', 'Gales', 'Inglaterra', 'Irlanda del Norte'],
  'República Dominicana': [
    'Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte',
    'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal', 'Independencia',
    'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez', 'Monseñor Nouel',
    'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná',
    'San Cristóbal', 'San José de Ocoa', 'San Juan', 'San Pedro de Macorís', 'Sánchez Ramírez',
    'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 'Valverde',
  ],
  Suiza: [
    'Appenzell Exterior', 'Appenzell Interior', 'Argovia', 'Basilea-Ciudad', 'Basilea-Campiña',
    'Berna', 'Friburgo', 'Ginebra', 'Glaris', 'Grisones', 'Jura', 'Lucerna', 'Neuchâtel',
    'Nidwalden', 'Obwalden', 'San Galo', 'Schaffhausen', 'Schwyz', 'Soleura', 'Turgovia',
    'Tesino', 'Uri', 'Valais', 'Vaud', 'Zug', 'Zúrich',
  ],
  Uruguay: [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
    'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
    'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres',
  ],
  Venezuela: [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
    'Cojedes', 'Delta Amacuro', 'Dependencias Federales', 'Distrito Capital', 'Falcón',
    'Guárico', 'La Guaira', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Yaracuy', 'Zulia',
  ],
}

/** Devuelve las divisiones de primer nivel del país, o null si no hay datos cargados. */
export function getSubdivisiones(pais: string): string[] | null {
  return SUBDIVISIONES[pais] ?? null
}
