# Seguimiento

App web para el móvil que sigue los entrenos de la semana (fuerza lunes y miércoles, running martes y jueves, y extras), recibe los datos del Apple Watch mediante un Atajo del iPhone y, en las siguientes fases, planificará las comidas y la compra para 2 personas.

## Fase 1 (esta versión)

- **Hoy**: el entreno del día y el objetivo de calorías y macros, que cambia según el entreno.
- **Entrenos**: calendario del mes con la fuerza en amarillo, el running en rosa y la zumba de los lunes en verde (desde el Watch llega como «Baile») (relleno si está hecho, claro si está pendiente). Al tocar un día se ven sus entrenos; abajo, resumen de la semana con entrenos hechos, kilómetros y series. Se pueden añadir entrenos extra.
- **Registro de fuerza**: ejercicios elegidos en cada entreno (recientes, por grupo muscular, buscando o escritos a mano), series con repeticiones y kg. Cada serie nueva se rellena con el peso de la última vez, y se muestra el récord de cada ejercicio.
- **Running**: distancia, tiempo, ritmo, pulso y calorías, importados del Watch o escritos a mano.
- **Importar del Apple Watch**: un Atajo del iPhone abre `#/importar?...` con los datos del último entreno; la app los enseña y los guarda al confirmar. Las instrucciones están en la propia app (Ajustes > Cómo enviar los entrenos con un Atajo).
- **Peso**: pesaje de los domingos (Hoy avisa cuando toca), gráfica de evolución, cambio total y ritmo semanal. El último pesaje actualiza el peso con el que se calculan las calorías.
- **Ajustes**: tus datos, el déficit, la segunda persona y sus raciones, y la copia de seguridad.

## Comidas y ciclo

- **Comidas**: calendario semanal (días en columnas, comidas en filas) con desayuno, almuerzo, merienda y cena. «Generar menú» elige recetas del recetario (`src/lib/recipes.ts`) y ajusta las raciones a las calorías de cada día, que dependen del entreno y de la fase del ciclo. Cada comida se puede cambiar por otra receta o por una comida libre.
- **Recetas**: unas 50, con macros por ración e ingredientes para los dos. Los almuerzos y cenas que se prestan llevan pasos para Thermomix; desayunos y meriendas no.
- **Buscador**: al tocar una comida se ven sugerencias según las calorías de ese hueco y un buscador por nombre o ingrediente. Si no está en el recetario, se puede buscar en Cookidoo o crear como receta propia (con sus ingredientes, que entran en la lista de la compra).
- **Calorías por ingredientes**: en una receta propia o en «Otra cosa», al escribir los ingredientes con su cantidad («150 g pechuga de pollo», «2 huevos», «1 cucharada de aceite») se calculan las kcal y los macros con la tabla de `src/lib/foods.ts` (valores por 100 g). Se ve el desglose por línea y se marcan los ingredientes que no reconoce. Un valor escrito a mano tiene prioridad.
- **No me gusta**: alimentos o grupos (curry, pescado, lácteos...) que el menú y las sugerencias evitan.
- **Lista de la compra**: suma los ingredientes del menú de 1 o 2 semanas para las dos personas, agrupados por sección, con casillas para ir tachando.
- **Ciclo**: calendario mensual con las fases en colores; tocar un día lo marca como inicio de regla. El inicio de cada regla se apunta a mano. Muestra fase y día del ciclo, previsión de la próxima regla y consejos de comida y entreno. En la fase lútea el déficit baja 150 kcal (se puede desactivar).

Los datos se guardan en el navegador del móvil (IndexedDB). Conviene usar la app siempre desde Safari (no desde la pantalla de inicio, porque el Atajo abre Safari) y descargar una copia de seguridad de vez en cuando.

## Cómo se calculan las calorías

Calorías del día = metabolismo basal (Mifflin-St Jeor) × 1,2 + 85 % de las calorías del entreno − déficit. Sin datos del Watch se estiman 300 kcal para fuerza y 400 kcal para running. Nunca baja de 1.500 kcal (1.800 en hombres).

Los datos personales no están en el código: se escriben en Ajustes la primera vez y se quedan en el móvil.

## Desarrollo

```sh
npm install
npm run dev      # servidor local
npm test         # pruebas
npm run build    # genera dist/ para publicar
```

- `src/lib`: lógica (fechas, cálculo nutricional, planificación semanal, importación, base de datos).
- `src/pages`: pantallas.
- `src/components`: piezas de interfaz comunes.
