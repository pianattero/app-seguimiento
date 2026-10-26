/**
 * Recetario base. Cantidades y valores nutricionales por 1 ración (aproximados).
 * Las especias, la sal y el agua no entran en la lista de la compra.
 */
import { cp, de, fv, lh, normalize, pan } from './ingredients'
import { planRecipes } from './planRecipes'

export { normalize, parseIngredientLines } from './ingredients'

export type MealSlot = 'desayuno' | 'almuerzo' | 'merienda' | 'cena'
export type ShopSection = 'Fruta y verdura' | 'Carne y pescado' | 'Lácteos y huevos' | 'Panadería' | 'Despensa' | 'Otros'

export const mealSlots: MealSlot[] = ['desayuno', 'almuerzo', 'merienda', 'cena']
export const slotLabel: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
}
/** Parte de las calorías del día que va a cada comida: más de día y menos de noche (crononutrición del plan). */
export const slotShare: Record<MealSlot, number> = { desayuno: 0.25, almuerzo: 0.375, merienda: 0.125, cena: 0.25 }

export const shopSections: ShopSection[] = ['Fruta y verdura', 'Carne y pescado', 'Lácteos y huevos', 'Panadería', 'Despensa', 'Otros']

export interface Ingredient {
  name: string
  qty: number
  unit: 'g' | 'ml' | 'ud'
  section: ShopSection
}

export interface Recipe {
  id: string
  name: string
  slots: MealSlot[]
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  minutes: number
  ingredients: Ingredient[]
  steps: string[]
  /** Pasos para Thermomix (TM5/TM6), cuando la receta se presta. */
  thermomix?: string[]
  /** Sale del plan de alimentación (reparto del plato de la nutricionista). */
  fromPlan?: boolean
  /** Lleva su ración de hidratos (arroz, pasta, papa, pan, masa...). Las cenas sin hidratos son para días sin running. */
  withCarbs?: boolean
  /** Plato que se acompaña con una guarnición elegida aparte (milanesa, tarta, pechuga...). */
  needsSide?: boolean
  /** Es una guarnición: no se elige sola como comida, acompaña a un plato. */
  side?: boolean
}

const baseRecipes: Recipe[] = [
  // Desayunos
  {
    id: 'yogur-avena-frutos-rojos',
    name: 'Yogur griego con avena y frutos rojos',
    slots: ['desayuno'],
    kcal: 330, proteinG: 26, carbsG: 35, fatG: 9, minutes: 5,
    ingredients: [lh('Yogur griego 0 %', 200), de('Copos de avena', 30), fv('Frutos rojos', 80), de('Nueces', 10)],
    steps: ['Pon el yogur en un bol.', 'Añade la avena, los frutos rojos y las nueces troceadas.'],
  },
  {
    id: 'tostada-huevo-aguacate',
    name: 'Tostada integral con huevo y aguacate',
    slots: ['desayuno'],
    kcal: 360, proteinG: 19, carbsG: 28, fatG: 18, minutes: 10,
    ingredients: [pan('Pan integral', 60), lh('Huevos', 2, 'ud'), fv('Aguacate', 40), fv('Tomate', 60)],
    steps: ['Tuesta el pan.', 'Haz los huevos a la plancha o revueltos.', 'Unta el aguacate, pon el tomate en rodajas y los huevos encima.'],
  },
  {
    id: 'porridge-platano',
    name: 'Porridge de avena con plátano y canela',
    slots: ['desayuno'],
    kcal: 285, proteinG: 14, carbsG: 47, fatG: 4, minutes: 10,
    ingredients: [de('Copos de avena', 40), lh('Leche desnatada', 250, 'ml'), fv('Plátano', 50)],
    steps: ['Cuece la avena con la leche a fuego medio 5 minutos, removiendo.', 'Sirve con el plátano en rodajas y canela.'],
  },
  {
    id: 'tortilla-claras-pavo',
    name: 'Tortilla de claras con pavo y tostada',
    slots: ['desayuno', 'cena'],
    kcal: 305, proteinG: 37, carbsG: 18, fatG: 8, minutes: 10,
    ingredients: [lh('Claras de huevo', 150, 'ml'), lh('Huevos', 1, 'ud'), cp('Pechuga de pavo en lonchas', 50), pan('Pan integral', 40)],
    steps: ['Bate las claras con el huevo.', 'Cuaja la tortilla en una sartén antiadherente con el pavo troceado.', 'Acompaña con el pan tostado.'],
  },
  {
    id: 'batido-skyr-platano',
    name: 'Batido de skyr, plátano y crema de cacahuete',
    slots: ['desayuno'],
    kcal: 390, proteinG: 29, carbsG: 53, fatG: 7, minutes: 5,
    ingredients: [lh('Skyr natural', 150), lh('Leche desnatada', 200, 'ml'), fv('Plátano', 100), de('Copos de avena', 20), de('Crema de cacahuete', 10)],
    steps: ['Tritura todo en la batidora hasta que quede fino.'],
  },

  // Almuerzos
  {
    id: 'pollo-curry-arroz',
    name: 'Pollo al curry con arroz basmati',
    slots: ['almuerzo'],
    kcal: 500, proteinG: 42, carbsG: 58, fatG: 11, minutes: 35,
    ingredients: [cp('Pechuga de pollo', 150), de('Arroz basmati', 60), fv('Cebolla', 50), fv('Pimiento rojo', 80), de('Leche de coco light', 50, 'ml'), de('Aceite de oliva', 5, 'ml')],
    steps: ['Cuece el arroz.', 'Sofríe la cebolla y el pimiento con el aceite, añade el pollo en dados y el curry.', 'Incorpora la leche de coco y cocina 10 minutos.', 'Sirve con el arroz.'],
    thermomix: [
      'Pica la cebolla y el pimiento: 5 s / velocidad 5. Añade el aceite: 5 min / 120 °C / velocidad 1.',
      'Añade el pollo en dados y el curry: 5 min / 100 °C / giro inverso / velocidad cuchara.',
      'Añade la leche de coco: 10 min / 100 °C / giro inverso / velocidad cuchara.',
      'Cuece el arroz aparte en el cestillo o en el cazo.',
    ],
  },
  {
    id: 'lentejas-verduras',
    name: 'Lentejas estofadas con verduras',
    slots: ['almuerzo'],
    kcal: 390, proteinG: 19, carbsG: 55, fatG: 8, minutes: 40,
    ingredients: [de('Lentejas pardinas', 70), fv('Zanahoria', 60), fv('Cebolla', 50), fv('Pimiento verde', 40), de('Tomate triturado', 80), de('Aceite de oliva', 7, 'ml')],
    steps: ['Sofríe la verdura picada con el aceite.', 'Añade el tomate, las lentejas, pimentón y agua que las cubra.', 'Cuece 30 minutos a fuego medio.'],
    thermomix: [
      'Trocea la cebolla, el pimiento y la zanahoria: 4 s / velocidad 5. Añade el aceite: 7 min / 120 °C / velocidad 1.',
      'Añade el tomate, las lentejas, pimentón y agua (unos 250 ml por ración): 30 min / 100 °C / giro inverso / velocidad cuchara.',
    ],
  },
  {
    id: 'salmon-patata-brocoli',
    name: 'Salmón con patata y brócoli',
    slots: ['almuerzo', 'cena'],
    kcal: 480, proteinG: 33, carbsG: 33, fatG: 23, minutes: 30,
    ingredients: [cp('Salmón', 130), fv('Patata', 150), fv('Brócoli', 150), de('Aceite de oliva', 5, 'ml')],
    steps: ['Hornea la patata en rodajas 15 minutos a 200 °C.', 'Añade el salmón y el brócoli y hornea 12 minutos más.', 'Aliña con el aceite.'],
    thermomix: [
      'Pon 500 ml de agua en el vaso y la patata en rodajas en el cestillo.',
      'Coloca el brócoli en el recipiente Varoma y el salmón en la bandeja: 25 min / Varoma / velocidad 1.',
      'Aliña con el aceite al servir.',
    ],
  },
  {
    id: 'garbanzos-espinacas-huevo',
    name: 'Garbanzos con espinacas y huevo',
    slots: ['almuerzo'],
    kcal: 420, proteinG: 24, carbsG: 38, fatG: 17, minutes: 15,
    ingredients: [de('Garbanzos cocidos', 200), fv('Espinacas', 150), de('Tomate triturado', 60), lh('Huevos', 1, 'ud'), de('Aceite de oliva', 7, 'ml')],
    steps: ['Saltea ajo con el aceite, añade el tomate y el comino.', 'Añade los garbanzos escurridos y las espinacas hasta que se ablanden.', 'Sirve con un huevo cocido o a la plancha.'],
  },
  {
    id: 'pasta-bolonesa-pavo',
    name: 'Pasta integral a la boloñesa de pavo',
    slots: ['almuerzo'],
    kcal: 500, proteinG: 38, carbsG: 58, fatG: 12, minutes: 30,
    ingredients: [de('Pasta integral', 70), cp('Carne picada de pavo', 120), de('Tomate triturado', 150), fv('Cebolla', 40), fv('Zanahoria', 40), de('Aceite de oliva', 5, 'ml')],
    steps: ['Cuece la pasta.', 'Sofríe la cebolla y la zanahoria picadas, añade el pavo y dóralo.', 'Añade el tomate y orégano y cocina 15 minutos.', 'Mezcla con la pasta.'],
    thermomix: [
      'Trocea la cebolla y la zanahoria: 5 s / velocidad 5. Añade el aceite: 5 min / 120 °C / velocidad 1.',
      'Añade el pavo: 5 min / 100 °C / giro inverso / velocidad cuchara.',
      'Añade el tomate y orégano: 15 min / 100 °C / giro inverso / velocidad cuchara. Cuece la pasta aparte.',
    ],
  },
  {
    id: 'quinoa-pollo-verduras',
    name: 'Quinoa con pollo y verduras asadas',
    slots: ['almuerzo'],
    kcal: 470, proteinG: 41, carbsG: 46, fatG: 14, minutes: 30,
    ingredients: [de('Quinoa', 60), cp('Pechuga de pollo', 130), fv('Calabacín', 150), fv('Pimiento rojo', 80), de('Aceite de oliva', 7, 'ml')],
    steps: ['Cuece la quinoa 15 minutos.', 'Asa el calabacín y el pimiento en dados 20 minutos a 200 °C.', 'Haz el pollo a la plancha y mezcla todo.'],
  },
  {
    id: 'merluza-salsa-verde',
    name: 'Merluza en salsa verde con patatas',
    slots: ['almuerzo', 'cena'],
    kcal: 360, proteinG: 36, carbsG: 30, fatG: 9, minutes: 30,
    ingredients: [cp('Merluza', 180), fv('Patata', 150), de('Aceite de oliva', 7, 'ml'), de('Harina', 5)],
    steps: ['Cuece la patata en rodajas.', 'Dora ajo y perejil en el aceite, añade la harina y un poco de caldo o agua.', 'Pon la merluza y cocina 6 minutos moviendo la cazuela.'],
    thermomix: [
      'Pica ajo y perejil: 3 s / velocidad 7. Añade el aceite: 3 min / 120 °C / velocidad 1.',
      'Añade la harina y 200 ml de agua: 4 min / 100 °C / velocidad 2.',
      'Pon la patata en el cestillo y la merluza en el Varoma: 20 min / Varoma / velocidad 1. Napa con la salsa.',
    ],
  },

  // Meriendas
  {
    id: 'manzana-queso-batido',
    name: 'Queso fresco batido con manzana',
    slots: ['merienda'],
    kcal: 150, proteinG: 12, carbsG: 26, fatG: 0, minutes: 2,
    ingredients: [lh('Queso fresco batido 0 %', 150), fv('Manzana', 1, 'ud')],
    steps: ['Trocea la manzana y mézclala con el queso batido y canela.'],
  },
  {
    id: 'tortitas-pavo',
    name: 'Tortitas de arroz con pavo',
    slots: ['merienda'],
    kcal: 170, proteinG: 15, carbsG: 23, fatG: 1, minutes: 2,
    ingredients: [pan('Tortitas de arroz', 3, 'ud'), cp('Pechuga de pavo en lonchas', 60)],
    steps: ['Pon el pavo sobre las tortitas.'],
  },
  {
    id: 'almendras-mandarina',
    name: 'Almendras y mandarinas',
    slots: ['merienda'],
    kcal: 170, proteinG: 5, carbsG: 14, fatG: 10, minutes: 1,
    ingredients: [de('Almendras', 20), fv('Mandarinas', 2, 'ud')],
    steps: ['Listo para llevar.'],
  },
  {
    id: 'hummus-crudites',
    name: 'Hummus con crudités',
    slots: ['merienda'],
    kcal: 170, proteinG: 6, carbsG: 18, fatG: 7, minutes: 5,
    ingredients: [de('Garbanzos cocidos', 60), de('Tahini', 5), de('Aceite de oliva', 3, 'ml'), fv('Zanahoria', 80), fv('Pepino', 70)],
    steps: ['Tritura los garbanzos con el tahini, el aceite, limón, comino y un poco de agua.', 'Sirve con la zanahoria y el pepino en bastones.'],
  },
  {
    id: 'skyr-nueces',
    name: 'Skyr con nueces y canela',
    slots: ['merienda'],
    kcal: 160, proteinG: 17, carbsG: 6, fatG: 7, minutes: 1,
    ingredients: [lh('Skyr natural', 150), de('Nueces', 10)],
    steps: ['Mezcla el skyr con las nueces y canela.'],
  },

  // Cenas
  {
    id: 'crema-calabacin-huevo',
    name: 'Crema de calabacín con huevo duro',
    slots: ['cena'],
    kcal: 340, proteinG: 19, carbsG: 24, fatG: 17, minutes: 25,
    ingredients: [fv('Calabacín', 300), fv('Cebolla', 50), fv('Patata', 80), lh('Quesitos light', 1, 'ud'), de('Aceite de oliva', 5, 'ml'), lh('Huevos', 2, 'ud')],
    steps: ['Pocha la cebolla con el aceite.', 'Añade el calabacín y la patata troceados y agua justa para cubrir. Cuece 15 minutos.', 'Tritura con el quesito y sirve con los huevos duros.'],
    thermomix: [
      'Trocea la cebolla: 4 s / velocidad 5. Añade el aceite: 5 min / 120 °C / velocidad 1.',
      'Añade calabacín, patata y 150 ml de agua por ración: 20 min / 100 °C / velocidad 1.',
      'Añade el quesito y tritura: 1 min / velocidad 5-10 progresivo. Cuece los huevos aparte.',
    ],
  },
  {
    id: 'tortilla-espinacas-ensalada',
    name: 'Tortilla de espinacas con ensalada',
    slots: ['cena'],
    kcal: 380, proteinG: 27, carbsG: 20, fatG: 18, minutes: 15,
    ingredients: [lh('Huevos', 2, 'ud'), lh('Claras de huevo', 100, 'ml'), fv('Espinacas', 100), fv('Lechuga', 100), fv('Tomate', 100), de('Aceite de oliva', 7, 'ml'), pan('Pan integral', 30)],
    steps: ['Saltea las espinacas.', 'Bate los huevos con las claras, añade las espinacas y cuaja la tortilla.', 'Acompaña con la ensalada y el pan.'],
  },
  {
    id: 'bacalao-vapor-verduras',
    name: 'Bacalao al vapor con verduras',
    slots: ['cena'],
    kcal: 300, proteinG: 34, carbsG: 17, fatG: 8, minutes: 30,
    ingredients: [cp('Bacalao fresco', 180), fv('Judías verdes', 150), fv('Zanahoria', 100), de('Aceite de oliva', 7, 'ml')],
    steps: ['Cuece al vapor las verduras 15 minutos.', 'Añade el bacalao los últimos 8 minutos.', 'Aliña con aceite y limón.'],
    thermomix: [
      'Pon 500 ml de agua en el vaso. Verduras en el recipiente Varoma y el bacalao en la bandeja.',
      '25 min / Varoma / velocidad 1. Aliña al servir.',
    ],
  },
  {
    id: 'ensalada-atun-garbanzos',
    name: 'Ensalada de atún, garbanzos y huevo',
    slots: ['almuerzo', 'cena'],
    kcal: 410, proteinG: 40, carbsG: 23, fatG: 15, minutes: 10,
    ingredients: [de('Atún al natural (lata)', 2, 'ud'), de('Garbanzos cocidos', 100), fv('Lechuga', 100), fv('Tomate', 100), lh('Huevos', 1, 'ud'), de('Aceite de oliva', 7, 'ml')],
    steps: ['Cuece el huevo.', 'Mezcla la lechuga, el tomate, los garbanzos y el atún escurrido.', 'Añade el huevo y aliña.'],
  },
  {
    id: 'pollo-verduras-asadas',
    name: 'Pollo a la plancha con verduras asadas',
    slots: ['cena'],
    kcal: 305, proteinG: 38, carbsG: 12, fatG: 10, minutes: 30,
    ingredients: [cp('Pechuga de pollo', 150), fv('Berenjena', 100), fv('Calabacín', 100), fv('Pimiento rojo', 100), de('Aceite de oliva', 7, 'ml')],
    steps: ['Asa las verduras en dados 25 minutos a 200 °C.', 'Haz el pollo a la plancha.'],
  },
  {
    id: 'wrap-pavo',
    name: 'Wrap integral de pavo y queso fresco',
    slots: ['cena'],
    kcal: 355, proteinG: 28, carbsG: 33, fatG: 10, minutes: 5,
    ingredients: [pan('Tortillas de trigo integral', 1, 'ud'), cp('Pechuga de pavo en lonchas', 80), lh('Queso fresco', 50), fv('Lechuga', 40), fv('Tomate', 60)],
    steps: ['Rellena la tortilla con el pavo, el queso, la lechuga y el tomate, y enróllala.'],
  },
  // Más desayunos
  {
    id: 'tostada-tomate-jamon',
    name: 'Tostada con tomate, aceite y jamón serrano',
    slots: ['desayuno'],
    kcal: 280, proteinG: 15, carbsG: 28, fatG: 12, minutes: 5,
    ingredients: [pan('Pan integral', 60), fv('Tomate', 60), de('Aceite de oliva', 5, 'ml'), cp('Jamón serrano', 30)],
    steps: ['Tuesta el pan, ralla el tomate por encima, añade el aceite y el jamón.'],
  },
  {
    id: 'tortitas-avena-platano',
    name: 'Tortitas de avena y plátano',
    slots: ['desayuno'],
    kcal: 295, proteinG: 19, carbsG: 36, fatG: 8, minutes: 15,
    ingredients: [de('Copos de avena', 40), lh('Huevos', 1, 'ud'), lh('Claras de huevo', 60, 'ml'), fv('Plátano', 50)],
    steps: ['Tritura la avena, el huevo, las claras y el plátano.', 'Haz tortitas pequeñas en una sartén antiadherente, 2 minutos por lado.'],
  },
  {
    id: 'requeson-kiwi-chia',
    name: 'Requesón con kiwi y chía',
    slots: ['desayuno', 'merienda'],
    kcal: 255, proteinG: 20, carbsG: 25, fatG: 9, minutes: 3,
    ingredients: [lh('Requesón', 150), fv('Kiwi', 2, 'ud'), de('Semillas de chía', 10)],
    steps: ['Pon el requesón en un bol con el kiwi troceado y la chía.'],
  },
  {
    id: 'muesli-leche-fresas',
    name: 'Muesli con leche y fresas',
    slots: ['desayuno'],
    kcal: 330, proteinG: 14, carbsG: 49, fatG: 8, minutes: 3,
    ingredients: [de('Muesli sin azúcar', 50), lh('Leche semidesnatada', 250, 'ml'), fv('Fresas', 100)],
    steps: ['Sirve el muesli con la leche y las fresas troceadas.'],
  },
  {
    id: 'revuelto-champinones',
    name: 'Revuelto de champiñones con tostada',
    slots: ['desayuno', 'cena'],
    kcal: 290, proteinG: 19, carbsG: 20, fatG: 15, minutes: 10,
    ingredients: [lh('Huevos', 2, 'ud'), fv('Champiñones', 100), pan('Pan integral', 40), de('Aceite de oliva', 3, 'ml')],
    steps: ['Saltea los champiñones laminados.', 'Añade los huevos batidos y remueve hasta que cuajen.', 'Sirve con el pan tostado.'],
  },

  // Más meriendas
  {
    id: 'yogur-kiwi',
    name: 'Yogur natural con kiwi',
    slots: ['merienda'],
    kcal: 155, proteinG: 11, carbsG: 25, fatG: 1, minutes: 2,
    ingredients: [lh('Yogur natural desnatado', 2, 'ud'), fv('Kiwi', 1, 'ud')],
    steps: ['Trocea el kiwi sobre los yogures.'],
  },
  {
    id: 'pan-queso-fresco-tomate',
    name: 'Tostada de queso fresco y tomate',
    slots: ['merienda'],
    kcal: 195, proteinG: 11, carbsG: 21, fatG: 8, minutes: 3,
    ingredients: [pan('Pan integral', 40), lh('Queso fresco', 60), fv('Tomate', 50)],
    steps: ['Tuesta el pan y ponle el queso y el tomate en rodajas.'],
  },
  {
    id: 'kefir-arandanos',
    name: 'Kéfir con arándanos',
    slots: ['merienda'],
    kcal: 135, proteinG: 7, carbsG: 17, fatG: 4, minutes: 1,
    ingredients: [lh('Kéfir', 200, 'ml'), fv('Arándanos', 60)],
    steps: ['Sirve el kéfir con los arándanos.'],
  },
  {
    id: 'edamame',
    name: 'Edamame con sal',
    slots: ['merienda'],
    kcal: 120, proteinG: 11, carbsG: 9, fatG: 5, minutes: 5,
    ingredients: [de('Edamame congelado', 100)],
    steps: ['Cuece el edamame 4 minutos y añade una pizca de sal.'],
  },
  {
    id: 'pera-chocolate',
    name: 'Pera con chocolate negro',
    slots: ['merienda'],
    kcal: 175, proteinG: 2, carbsG: 24, fatG: 8, minutes: 1,
    ingredients: [fv('Peras', 1, 'ud'), de('Chocolate negro 85 %', 15)],
    steps: ['Acompaña la pera con un par de onzas de chocolate.'],
  },

  // Más almuerzos
  {
    id: 'risotto-pollo-champinones',
    name: 'Risotto de pollo y champiñones',
    slots: ['almuerzo'],
    kcal: 445, proteinG: 34, carbsG: 53, fatG: 10, minutes: 30,
    ingredients: [de('Arroz arborio', 60), cp('Pechuga de pollo', 100), fv('Champiñones', 100), fv('Cebolla', 40), lh('Queso parmesano', 10), de('Aceite de oliva', 5, 'ml')],
    steps: ['Sofríe la cebolla y el pollo en dados.', 'Añade los champiñones y el arroz, y ve echando caldo caliente poco a poco 18 minutos.', 'Termina con el parmesano.'],
    thermomix: [
      'Trocea la cebolla: 4 s / velocidad 5. Añade el aceite: 5 min / 120 °C / velocidad 1.',
      'Añade el pollo y los champiñones: 5 min / 120 °C / giro inverso / velocidad cuchara.',
      'Añade el arroz y 200 ml de caldo por ración: 17 min / 100 °C / giro inverso / velocidad cuchara. Mezcla con el parmesano y deja reposar 2 minutos.',
    ],
  },
  {
    id: 'chili-sin-carne-ternera',
    name: 'Chili de alubias y ternera con arroz',
    slots: ['almuerzo'],
    kcal: 500, proteinG: 33, carbsG: 67, fatG: 9, minutes: 35,
    ingredients: [de('Alubias rojas cocidas', 150), cp('Carne picada de ternera magra', 100), de('Tomate triturado', 150), fv('Pimiento rojo', 60), fv('Cebolla', 40), de('Arroz basmati', 40)],
    steps: ['Sofríe la cebolla y el pimiento, añade la carne y dórala.', 'Añade el tomate, las alubias, comino y pimentón; cocina 20 minutos.', 'Sirve con el arroz.'],
    thermomix: [
      'Trocea la cebolla y el pimiento: 4 s / velocidad 5. Sofríe: 5 min / 120 °C / velocidad 1.',
      'Añade la carne: 5 min / 100 °C / giro inverso / velocidad cuchara.',
      'Añade el tomate, las alubias y las especias: 20 min / 100 °C / giro inverso / velocidad cuchara. Cuece el arroz aparte.',
    ],
  },
  {
    id: 'pavo-boniato',
    name: 'Pavo a la plancha con boniato asado',
    slots: ['almuerzo'],
    kcal: 420, proteinG: 38, carbsG: 43, fatG: 9, minutes: 35,
    ingredients: [cp('Pechuga de pavo', 150), fv('Boniato', 200), fv('Lechuga', 100), de('Aceite de oliva', 7, 'ml')],
    steps: ['Asa el boniato en gajos 30 minutos a 200 °C.', 'Haz el pavo a la plancha.', 'Acompaña con la ensalada.'],
    thermomix: ['Pon 500 ml de agua en el vaso, el boniato en gajos en el Varoma y el pavo en la bandeja: 30 min / Varoma / velocidad 1. Dóralo después en la sartén si quieres.'],
  },
  {
    id: 'albondigas-pavo-tomate',
    name: 'Albóndigas de pavo en salsa de tomate con arroz',
    slots: ['almuerzo'],
    kcal: 480, proteinG: 35, carbsG: 55, fatG: 11, minutes: 40,
    ingredients: [cp('Carne picada de pavo', 140), de('Pan rallado', 10), de('Tomate triturado', 150), fv('Cebolla', 40), de('Arroz basmati', 50), de('Aceite de oliva', 5, 'ml')],
    steps: ['Forma las albóndigas con la carne, el pan rallado, ajo y perejil.', 'Haz la salsa con la cebolla y el tomate y cuece en ella las albóndigas 20 minutos.', 'Sirve con el arroz.'],
    thermomix: [
      'Haz la salsa: cebolla 4 s / velocidad 5, sofríe con el aceite 5 min / 120 °C / velocidad 1, añade el tomate 10 min / 100 °C / velocidad 1.',
      'Pon las albóndigas en el Varoma: 25 min / Varoma / velocidad 1 (con 300 ml de agua en el vaso si la salsa va aparte).',
      'Junta las albóndigas con la salsa. Cuece el arroz aparte.',
    ],
  },
  {
    id: 'arroz-verduras-gambas',
    name: 'Arroz con verduras y gambas',
    slots: ['almuerzo'],
    kcal: 430, proteinG: 29, carbsG: 56, fatG: 9, minutes: 30,
    ingredients: [de('Arroz redondo', 60), cp('Gambas peladas', 120), fv('Judías verdes', 60), fv('Pimiento rojo', 60), de('Tomate triturado', 50), de('Aceite de oliva', 7, 'ml')],
    steps: ['Sofríe las verduras con el aceite, añade el tomate y el pimentón.', 'Añade el arroz y el caldo, cuece 15 minutos y pon las gambas los últimos 3.'],
    thermomix: [
      'Sofríe las verduras con el aceite: 5 min / 120 °C / giro inverso / velocidad cuchara.',
      'Añade el tomate, el arroz y 200 ml de caldo por ración: 13 min / 100 °C / giro inverso / velocidad cuchara.',
      'Añade las gambas: 3 min / 100 °C / giro inverso / velocidad cuchara.',
    ],
  },
  {
    id: 'fajitas-pollo',
    name: 'Fajitas de pollo con pimientos',
    slots: ['almuerzo', 'cena'],
    kcal: 470, proteinG: 38, carbsG: 49, fatG: 12, minutes: 20,
    ingredients: [pan('Tortillas de trigo integral pequeñas', 2, 'ud'), cp('Pechuga de pollo', 130), fv('Pimiento rojo', 100), fv('Cebolla', 50), de('Aceite de oliva', 5, 'ml')],
    steps: ['Saltea el pollo en tiras con el pimiento y la cebolla y especias de fajita.', 'Rellena las tortillas calientes.'],
  },
  {
    id: 'ternera-wok-arroz',
    name: 'Ternera al wok con verduras y arroz',
    slots: ['almuerzo'],
    kcal: 460, proteinG: 34, carbsG: 48, fatG: 12, minutes: 20,
    ingredients: [cp('Ternera en tiras', 130), de('Arroz basmati', 50), fv('Brócoli', 100), fv('Zanahoria', 50), de('Salsa de soja', 10, 'ml'), de('Aceite de oliva', 5, 'ml')],
    steps: ['Cuece el arroz.', 'Saltea a fuego fuerte la ternera, retírala y saltea las verduras.', 'Junta todo con la soja.'],
  },
  {
    id: 'macarrones-atun-tomate',
    name: 'Macarrones integrales con atún y tomate',
    slots: ['almuerzo'],
    kcal: 405, proteinG: 23, carbsG: 59, fatG: 7, minutes: 20,
    ingredients: [de('Pasta integral', 70), de('Atún al natural (lata)', 1, 'ud'), de('Tomate triturado', 150), fv('Cebolla', 40), de('Aceite de oliva', 5, 'ml')],
    steps: ['Cuece la pasta.', 'Sofríe la cebolla, añade el tomate y cocina 10 minutos.', 'Añade el atún y mezcla con la pasta.'],
    thermomix: [
      'Trocea la cebolla: 4 s / velocidad 5. Sofríe con el aceite: 5 min / 120 °C / velocidad 1.',
      'Añade el tomate: 10 min / 100 °C / velocidad 1. Añade el atún: 1 min / giro inverso / velocidad cuchara. Cuece la pasta aparte.',
    ],
  },

  // Más cenas
  {
    id: 'crema-calabaza-jamon',
    name: 'Crema de calabaza con virutas de jamón',
    slots: ['cena'],
    kcal: 285, proteinG: 20, carbsG: 30, fatG: 10, minutes: 30,
    ingredients: [fv('Calabaza', 300), fv('Cebolla', 50), fv('Zanahoria', 50), de('Aceite de oliva', 5, 'ml'), lh('Queso fresco batido 0 %', 100), cp('Jamón serrano', 30)],
    steps: ['Pocha la cebolla, añade la calabaza y la zanahoria con agua justa y cuece 20 minutos.', 'Tritura con el queso batido y sirve con el jamón por encima.'],
    thermomix: [
      'Trocea la cebolla: 4 s / velocidad 5. Sofríe con el aceite: 5 min / 120 °C / velocidad 1.',
      'Añade calabaza, zanahoria y 150 ml de agua por ración: 20 min / 100 °C / velocidad 1.',
      'Añade el queso batido y tritura: 1 min / velocidad 5-10 progresivo.',
    ],
  },
  {
    id: 'merluza-papillote',
    name: 'Merluza en papillote con verduras',
    slots: ['cena'],
    kcal: 320, proteinG: 35, carbsG: 26, fatG: 7, minutes: 25,
    ingredients: [cp('Merluza', 180), fv('Calabacín', 100), fv('Cebolla', 40), fv('Tomate', 80), fv('Patata', 100), de('Aceite de oliva', 5, 'ml')],
    steps: ['Pon la verdura en láminas sobre papel de horno, encima la merluza y el aceite.', 'Cierra el paquete y hornea 18 minutos a 200 °C.'],
    thermomix: ['Pon 500 ml de agua en el vaso. Verduras y patata en el Varoma y la merluza en la bandeja: 25 min / Varoma / velocidad 1.'],
  },
  {
    id: 'hamburguesa-pollo',
    name: 'Hamburguesa de pollo con ensalada',
    slots: ['cena'],
    kcal: 350, proteinG: 39, carbsG: 29, fatG: 8, minutes: 15,
    ingredients: [cp('Carne picada de pollo', 150), pan('Pan de hamburguesa integral', 1, 'ud'), fv('Lechuga', 50), fv('Tomate', 50)],
    steps: ['Forma la hamburguesa y hazla a la plancha.', 'Monta el pan con lechuga y tomate.'],
  },
  {
    id: 'revuelto-gambas-ajetes',
    name: 'Revuelto de gambas y ajetes',
    slots: ['cena'],
    kcal: 355, proteinG: 31, carbsG: 17, fatG: 17, minutes: 10,
    ingredients: [lh('Huevos', 2, 'ud'), cp('Gambas peladas', 80), fv('Ajetes', 60), de('Aceite de oliva', 5, 'ml'), pan('Pan integral', 30)],
    steps: ['Saltea los ajetes y las gambas.', 'Añade los huevos batidos y remueve hasta que cuajen.'],
  },
  {
    id: 'sopa-pollo-fideos',
    name: 'Sopa de pollo con fideos',
    slots: ['cena'],
    kcal: 265, proteinG: 28, carbsG: 32, fatG: 2, minutes: 35,
    ingredients: [cp('Pechuga de pollo', 100), de('Fideos', 30), fv('Zanahoria', 50), fv('Puerro', 50)],
    steps: ['Cuece el pollo con la zanahoria y el puerro en 400 ml de agua 25 minutos.', 'Desmenuza el pollo, añade los fideos y cuece 5 minutos más.'],
    thermomix: [
      'Pon el pollo, la zanahoria, el puerro y 400 ml de agua por ración: 25 min / 100 °C / giro inverso / velocidad cuchara.',
      'Añade los fideos: 5 min / 100 °C / giro inverso / velocidad cuchara.',
    ],
  },
  {
    id: 'lubina-horno',
    name: 'Lubina al horno con patata y pimiento',
    slots: ['cena', 'almuerzo'],
    kcal: 355, proteinG: 37, carbsG: 25, fatG: 11, minutes: 35,
    ingredients: [cp('Lubina', 180), fv('Patata', 100), fv('Pimiento rojo', 80), fv('Cebolla', 50), de('Aceite de oliva', 7, 'ml')],
    steps: ['Hornea la patata, el pimiento y la cebolla 20 minutos a 200 °C.', 'Pon la lubina encima y hornea 12 minutos más.'],
  },
  {
    id: 'tofu-salteado',
    name: 'Tofu salteado con verduras y arroz',
    slots: ['cena', 'almuerzo'],
    kcal: 420, proteinG: 24, carbsG: 43, fatG: 16, minutes: 20,
    ingredients: [de('Tofu firme', 150), fv('Brócoli', 100), fv('Pimiento rojo', 80), de('Salsa de soja', 10, 'ml'), de('Arroz basmati', 40), de('Aceite de oliva', 5, 'ml')],
    steps: ['Cuece el arroz.', 'Dora el tofu en dados y saltea las verduras.', 'Junta todo con la soja.'],
  },
  {
    id: 'pizza-tortilla',
    name: 'Pizza rápida en tortilla integral',
    slots: ['cena'],
    kcal: 345, proteinG: 26, carbsG: 33, fatG: 11, minutes: 15,
    ingredients: [pan('Tortillas de trigo integral', 1, 'ud'), de('Tomate triturado', 50), lh('Mozzarella light', 60), fv('Champiñones', 50), cp('Pechuga de pavo en lonchas', 40)],
    steps: ['Unta la tortilla con el tomate, añade la mozzarella, los champiñones y el pavo.', 'Hornea 8 minutos a 220 °C.'],
  },
]

/** Primero las del plan de alimentación, luego el recetario general. */
export const recipes: Recipe[] = [...planRecipes, ...baseRecipes]

export const recipeById = new Map(recipes.map((r) => [r.id, r]))

/** Recetas propias guardadas en el móvil; la app las registra al cargar. */
let customRecipes: Recipe[] = []

export function setCustomRecipes(list: Recipe[]) {
  customRecipes = list
}

export function allRecipes(): Recipe[] {
  return [...recipes, ...customRecipes]
}

export function getRecipe(id: string): Recipe | undefined {
  return recipeById.get(id) ?? customRecipes.find((r) => r.id === id)
}

function searchableText(recipe: Recipe): string {
  return normalize([recipe.name, ...recipe.ingredients.map((i) => i.name)].join(' '))
}

/** Grupos de alimentos: excluir el grupo excluye cada uno de sus alimentos. */
export const foodGroups: Record<string, string[]> = {
  lacteos: ['leche', 'yogur', 'queso', 'quesito', 'skyr', 'kefir', 'requeson', 'mozzarella', 'parmesano'],
  pescado: ['salmon', 'merluza', 'bacalao', 'lubina', 'atun'],
  marisco: ['gambas'],
  'frutos secos': ['nueces', 'almendras', 'cacahuete'],
  cerdo: ['jamon', 'chorizo', 'cerdo'],
  'carne roja': ['ternera'],
  huevo: ['huevo', 'claras'],
  gluten: ['pan', 'pasta', 'fideos', 'harina', 'tortilla de trigo', 'tortillas de trigo', 'muesli', 'avena'],
}

function expand(term: string): string[] {
  const t = normalize(term.trim())
  return [t, ...(foodGroups[t] ?? [])]
}

/** false si la receta contiene algo de la lista de alimentos excluidos (en el nombre o en los ingredientes). */
export function isAllowed(recipe: Recipe, excluded: string[] = []): boolean {
  const text = searchableText(recipe)
  return !excluded.some((term) => term.trim() && expand(term).some((t) => text.includes(t)))
}

export function recipesFor(slot: MealSlot, excluded: string[] = []): Recipe[] {
  return allRecipes().filter((r) => r.slots.includes(slot) && isAllowed(r, excluded))
}

/** Guarniciones para acompañar platos, sin las que llevan alimentos excluidos. */
export function sidesFor(excluded: string[] = []): Recipe[] {
  return allRecipes().filter((r) => r.side && isAllowed(r, excluded))
}

/** Busca por nombre o ingrediente; todas las palabras deben aparecer. Las guarniciones no salen. */
export function searchRecipes(query: string, excluded: string[] = []): Recipe[] {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return allRecipes().filter((r) => {
    if (r.side) return false
    const text = searchableText(r)
    return isAllowed(r, excluded) && words.every((w) => text.includes(w))
  })
}
