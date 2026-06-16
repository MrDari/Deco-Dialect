/* Categorías por idioma. El juego elige una categoría al azar por turno
   y genera un mazo de letras (algunas doradas). No valida palabras: lo
   juzgan los jugadores (como en el juego original), lo que mantiene el
   contenido infinito y ligero. */
window.CATEGORIES = {
  'es-ES': [
    'Animales', 'Frutas y verduras', 'Países', 'Ciudades', 'Nombres propios',
    'Profesiones', 'Marcas', 'Deportes', 'Películas', 'Comidas',
    'Objetos de casa', 'Partes del cuerpo', 'Colores', 'Instrumentos musicales',
    'Cosas frías', 'Cosas que vuelan', 'Famosos', 'Ropa', 'En la cocina',
    'Cosas redondas', 'Personajes de ficción', 'Bebidas', 'Flores y plantas',
    'Medios de transporte', 'Juegos de mesa', 'Cosas de la playa', 'Verbos',
    'Apps y webs', 'Capitales', 'Cosas que dan miedo',
    'Cócteles', 'Cosas que flotan', 'Algo amarillo', 'Material de oficina',
    'Personajes de Marvel', 'Videojuegos', 'Personajes de dibujos', 'Superpoderes',
    'Cosas del espacio', 'Cosas blandas',
    'Cosas verdes', 'Cosas caras', 'Cosas pesadas', 'Cosas ruidosas', 'Cosas pequeñas',
    'Cosas duras', 'Cosas pegajosas', 'Cosas brillantes', 'Cosas peligrosas', 'Cosas viejas',
    'Animales marinos', 'Insectos', 'Aves', 'Razas de perro', 'Dinosaurios',
    'Postres', 'Verduras', 'Especias', 'Tipos de pan', 'Quesos',
    'Herramientas', 'Muebles', 'Electrodomésticos', 'Juguetes', 'Joyas',
    'Idiomas', 'Ríos', 'Montañas', 'Islas', 'Continentes',
    'Planetas y estrellas', 'Elementos químicos', 'Partes de un coche', 'Tipos de baile', 'Géneros musicales',
    'Series de TV', 'Dibujos animados', 'Villanos', 'Superhéroes', 'Princesas Disney',
    'Cosas en un parque', 'Cosas del cole', 'Cosas del baño', 'Cosas del hospital', 'Cosas de un avión',
    'Profesiones peligrosas', 'Deportes de equipo', 'Cosas que se reciclan', 'Materiales', 'Sentimientos'
  ],
  'en': [
    'Animals', 'Fruits & veggies', 'Countries', 'Cities', 'First names',
    'Jobs', 'Brands', 'Sports', 'Movies', 'Foods',
    'Household items', 'Body parts', 'Colors', 'Musical instruments',
    'Cold things', 'Things that fly', 'Celebrities', 'Clothing', 'In the kitchen',
    'Round things', 'Fictional characters', 'Drinks', 'Flowers & plants',
    'Means of transport', 'Board games', 'Things at the beach', 'Verbs',
    'Apps & websites', 'Capitals', 'Scary things',
    'Cocktails', 'Things that float', 'Something yellow', 'Office supplies',
    'Marvel characters', 'Video games', 'Cartoon characters', 'Superpowers',
    'Things in space', 'Things that are soft',
    'Green things', 'Expensive things', 'Heavy things', 'Loud things', 'Small things',
    'Hard things', 'Sticky things', 'Shiny things', 'Dangerous things', 'Old things',
    'Sea animals', 'Insects', 'Birds', 'Dog breeds', 'Dinosaurs',
    'Desserts', 'Vegetables', 'Spices', 'Types of bread', 'Cheeses',
    'Tools', 'Furniture', 'Appliances', 'Toys', 'Jewelry',
    'Languages', 'Rivers', 'Mountains', 'Islands', 'Continents',
    'Planets & stars', 'Chemical elements', 'Car parts', 'Dance styles', 'Music genres',
    'TV series', 'Cartoons', 'Villains', 'Superheroes', 'Disney princesses',
    'Things in a park', 'Things at school', 'Things in a bathroom', 'Things in a hospital', 'Things on a plane',
    'Dangerous jobs', 'Team sports', 'Recyclable things', 'Materials', 'Feelings'
  ]
};

/* Alfabeto utilizable por idioma, ponderado para evitar letras casi
   imposibles (q, x, k, w en español). El peso es la frecuencia con la
   que la letra puede aparecer en el mazo. */
window.LETTER_POOLS = {
  es: 'AAAABBCCDDEEEEFFGGHIIIJLLMMNNOOOOPPRRRSSSTTUUVY'.split(''),
  en: 'AAAABBCCDDEEEEFFGGHHIIIJKLLMMNNOOOOPPRRRSSSTTTUUVWY'.split('')
};
