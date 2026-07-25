// Banco de palabras agrupado por longitud. Para ampliarlo basta con añadir
// palabras a la lista que corresponda: fácil 3-5 letras, medio 6-8, difícil 9+.

export const WORDS = {
  easy: [
    "casa", "mesa", "sol", "lago", "flor", "perro", "gato", "luna", "pan",
    "mar", "río", "nube", "silla", "libro", "dedo", "pelo", "ojo", "boca",
    "pie", "taza", "vaso", "plato", "verde", "azul", "rojo", "nieve", "hoja",
    "rama", "arena", "playa", "barco", "tren", "avión", "moto", "coche",
    "calle", "plaza", "techo", "pared", "llave", "reloj", "papel", "lápiz",
    "tinta", "carta", "sopa", "queso", "huevo", "fruta", "uva", "pera",
    "limón", "melón", "mango", "fresa", "leche", "café", "miel", "sal",
    "dulce", "fuego", "agua", "cielo", "rayo", "campo", "monte", "valle",
    "selva", "nido", "pluma", "pico", "cola", "pata", "tigre", "lobo", "oso",
    "pez", "rana", "mosca", "abeja", "araña", "burro", "vaca", "cabra",
    "oveja", "pollo", "pato", "ganso", "cisne", "búho", "zorro", "ratón",
    "mono", "foca", "lince", "árbol",
  ],
  medium: [
    "ventana", "escalera", "tomate", "zapatero", "película", "montaña",
    "caballo", "cocina", "jardín", "camino", "ciudad", "pueblo", "familia",
    "hermano", "abuelo", "amistad", "silencio", "recuerdo", "mañana",
    "semana", "minuto", "segundo", "botella", "cuchara", "tenedor",
    "cuchillo", "mantel", "armario", "espejo", "cortina", "alfombra",
    "lámpara", "sillón", "estante", "maleta", "mochila", "cartera", "zapato",
    "camisa", "pantalón", "sombrero", "guante", "bufanda", "abrigo",
    "botones", "cordón", "tijeras", "pincel", "cuaderno", "carpeta",
    "pizarra", "maestro", "alumno", "colegio", "examen", "lectura",
    "palabra", "historia", "pregunta", "esfuerzo", "trabajo", "oficina",
    "reunión", "proyecto", "mensaje", "teléfono", "pantalla", "teclado",
    "archivo", "piedra", "puerta", "tierra", "bosque", "viento", "lluvia",
    "trueno", "cuerno", "grillo", "sonrisa", "mirada", "camisón",
  ],
  hard: [
    "responsabilidad", "electrodoméstico", "arquitectura", "internacional",
    "programación", "extraordinario", "computadora", "refrigerador",
    "universidad", "biblioteca", "matemáticas", "literatura", "geografía",
    "astronomía", "inteligencia", "imaginación", "naturaleza", "experiencia",
    "conocimiento", "aprendizaje", "enseñanza", "curiosidad", "creatividad",
    "disciplina", "constancia", "paciencia", "confianza", "esperanza",
    "felicidad", "tranquilidad", "generosidad", "honestidad", "solidaridad",
    "comunidad", "ciudadano", "democracia", "presidente", "ministerio",
    "secretaria", "documento", "formulario", "presupuesto", "inversión",
    "industria", "tecnología", "ingeniería", "laboratorio", "experimento",
    "científico", "investigación", "descubrimiento", "invención",
    "telescopio", "microscopio", "enfermera", "tratamiento", "medicamento",
    "diagnóstico", "radiografía", "esqueleto", "musculatura", "respiración",
    "circulación", "alimentación", "vitaminas", "proteínas", "restaurante",
    "ingrediente", "condimento", "preparación", "transporte", "ferrocarril",
    "aeropuerto", "navegación", "territorio", "continente", "montañismo",
  ],
} as const;

export type Difficulty = keyof typeof WORDS;
