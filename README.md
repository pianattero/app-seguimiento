# Seguimiento

App web para el móvil que sigue los entrenos de la semana (fuerza lunes y miércoles, running martes y jueves, y extras), recibe los datos del Apple Watch mediante un Atajo del iPhone y, en las siguientes fases, planificará las comidas y la compra para 2 personas.

## Fase 1 (esta versión)

- **Hoy**: el entreno del día y el objetivo de calorías y macros, que cambia según el entreno.
- **Entrenos**: la semana de lunes a domingo con la plantilla fija, resumen de entrenos hechos, kilómetros y series. Se pueden añadir entrenos extra.
- **Registro de fuerza**: ejercicios de la rutina del día, series con repeticiones y kg. Cada serie nueva se rellena con el peso de la última vez, y se muestra el récord de cada ejercicio.
- **Running**: distancia, tiempo, ritmo, pulso y calorías, importados del Watch o escritos a mano.
- **Importar del Apple Watch**: un Atajo del iPhone abre `#/importar?...` con los datos del último entreno; la app los enseña y los guarda al confirmar. Las instrucciones están en la propia app (Ajustes > Cómo enviar los entrenos con un Atajo).
- **Ajustes**: tus datos, el déficit, la segunda persona y sus raciones, las rutinas de cada día y la copia de seguridad.

Los datos se guardan en el navegador del móvil (IndexedDB). Conviene usar la app siempre desde Safari (no desde la pantalla de inicio, porque el Atajo abre Safari) y descargar una copia de seguridad de vez en cuando.

## Cómo se calculan las calorías

Calorías del día = metabolismo basal (Mifflin-St Jeor) × 1,2 + 85 % de las calorías del entreno − déficit. Sin datos del Watch se estiman 300 kcal para fuerza y 400 kcal para running. Nunca baja de 1.500 kcal (1.800 en hombres).

Con los datos de partida (88,5 kg, 170 cm, 27 años, déficit de 500 kcal): 1.500 kcal en descanso, unas 1.740 en fuerza y unas 1.820 en running, con unos 133 g de proteína.

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
