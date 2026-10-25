/**
 * Recetario base. Cantidades y valores nutricionales por 1 ración (aproximados).
 * Las especias, la sal y el agua no entran en la lista de la compra.
 */

export type MealSlot = 'desayuno' | 'almuerzo' | 'merienda' | 'cena'
export type ShopSection = 'Fruta y verdura' | 'Carne y pescado' | 'Lácteos y huevos' | 'Panadería' | 'Despensa'

export const mealSlots: MealSlot[] = ['desayuno', 'almuerzo', 'merienda', 'cena']
export const slotLabel: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
}
/** Parte de las calorías del día que va a cada comida. */
export const slotShare: Record<MealSlot, number> = { desayuno: 0.25, almuerzo: 0.35, merienda: 0.1, cena: 0.3 }

export const shopSections: ShopSection[] = ['Fruta y verdura', 'Carne y pescado', 'Lácteos y huevos', 'Panadería', 'Despensa']

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
}

const fv = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Fruta y verdura' })
const cp = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Carne y pescado' })
const lh = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Lácteos y huevos' })
const pan = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Panadería' })
const de = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Despensa' })

export const recipes: Recipe[] = [
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
    thermomix: ['Pon la avena y la leche en el vaso: 7 min / 90 °C / giro inverso / velocidad cuchara.', 'Sirve con el plátano y canela.'],
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
    thermomix: ['Pon todos los ingredientes en el vaso: 1 min / velocidad 8.'],
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
    thermomix: ['Pon garbanzos, tahini, aceite, limón, comino y 20 ml de agua: 30 s / velocidad 7. Baja los restos y repite si hace falta.'],
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
]

export const recipeById = new Map(recipes.map((r) => [r.id, r]))

export function recipesFor(slot: MealSlot): Recipe[] {
  return recipes.filter((r) => r.slots.includes(slot))
}
