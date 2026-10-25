# Seguimiento

App de iPhone para seguir los entrenos de la semana (fuerza lunes y miércoles, running martes y jueves, y extras), importar los datos del Apple Watch y, en las siguientes fases, planificar las comidas y la compra para 2 personas.

## Fase 1 (esta versión)

- **Hoy**: el entreno del día y el objetivo de calorías y macros, que cambia según el entreno.
- **Entrenos**: la semana de lunes a domingo con la plantilla fija. Sincroniza con Apple Salud para traer distancia, ritmo, pulso y calorías del Watch. Los entrenos del Watch que no estaban previstos aparecen como extra.
- **Registro de fuerza**: ejercicios de la rutina del día, series con repeticiones y kg. Cada serie nueva se rellena con el peso de la última vez y se muestra tu récord por ejercicio.
- **Ajustes**: tus datos, el déficit, los datos de la segunda persona y sus raciones, y las rutinas de fuerza de cada día.

## Cómo instalarla en tu iPhone (sin pagar)

Necesitas un Mac con Xcode y tu iPhone con un cable.

1. Instala **Xcode** desde la App Store y ábrelo una vez para que termine de instalar sus componentes.
2. Instala **XcodeGen**, que crea el proyecto de Xcode a partir de `project.yml`. En Terminal:
   ```sh
   brew install xcodegen
   ```
   Si no tienes Homebrew, instálalo antes desde https://brew.sh.
3. Descarga el código y genera el proyecto:
   ```sh
   git clone https://github.com/pianattero/<repositorio>.git
   cd <repositorio>
   xcodegen
   open Seguimiento.xcodeproj
   ```
4. En Xcode, ve a **Settings > Accounts** y añade tu Apple ID.
5. Selecciona el proyecto **Seguimiento**, la pestaña **Signing & Capabilities**, y en **Team** elige tu "Personal Team". Si Xcode dice que el identificador ya está en uso, cambia `com.pianattero.seguimiento` por otro (por ejemplo añadiendo tu nombre).
6. Conecta el iPhone. La primera vez activa **Ajustes > Privacidad y seguridad > Modo de desarrollador** y reinicia el móvil.
7. Elige tu iPhone arriba en Xcode y pulsa ▶.
8. La primera vez, en el iPhone ve a **Ajustes > General > VPN y gestión de dispositivos** y confía en tu Apple ID.
9. Abre la app, ve a **Ajustes > Dar permiso a Apple Salud** y acepta todo.

Con la cuenta gratuita la app deja de abrirse a los 7 días. Para renovarla, conecta el iPhone y pulsa ▶ otra vez en Xcode: tus datos se conservan. Lo que borra los datos es eliminar la app del iPhone.

Los datos se guardan solo en el iPhone. La sincronización con iCloud necesita la cuenta de pago de Apple Developer.

## Cómo se calculan las calorías

Calorías del día = metabolismo basal (fórmula Mifflin-St Jeor) × 1,2 + 85 % de las calorías del entreno − déficit. Mientras no hay datos del Watch, se usa una estimación de 300 kcal para la fuerza y 400 kcal para el running. Nunca baja de 1.500 kcal (1.800 en hombres).

Con los datos de partida (88,5 kg, 170 cm, 27 años, déficit de 500 kcal), salen 1.500 kcal en los días de descanso, unas 1.740 en los de fuerza y unas 1.820 en los de running, con unos 133 g de proteína.

## Estructura

- `Seguimiento/Models`: datos guardados con SwiftData (perfil, rutinas, sesiones, series).
- `Seguimiento/Services`: lectura de Apple Salud, plantilla semanal, cálculo de calorías.
- `Seguimiento/Views`: pantallas en SwiftUI.
- `SeguimientoTests`: pruebas del cálculo y de la planificación semanal (en Xcode, ⌘U).
