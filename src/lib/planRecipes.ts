/**
 * Recetas que siguen el plan de alimentación: desayunos y meriendas de 1/3 fruta, 1/3 proteína y 1/3 hidratos
 * o grasas; almuerzos de 1/2 proteína, 1/4 verdura y 1/4 hidratos; cenas de 1/2 verdura y 1/2 proteína
 * (con hidratos solo los días de running). Una grasa saludable en cada comida.
 * Las kcal y macros salen de la tabla de alimentos, así siempre cuadran con los ingredientes.
 */
import { ingredientNutrition } from './foods'
import { cp, de, fv, lh, pan } from './ingredients'
import type { Ingredient, MealSlot, Recipe } from './recipes'

interface PlanRecipe {
  id: string
  name: string
  slots: MealSlot[]
  minutes: number
  ingredients: Ingredient[]
  steps: string[]
  withCarbs?: boolean
}

function planRecipe(r: PlanRecipe): Recipe {
  const sum = (key: 'kcal' | 'proteinG' | 'carbsG' | 'fatG') => Math.round(r.ingredients.reduce((t, i) => t + ingredientNutrition(i)[key], 0))
  return { ...r, id: `plan-${r.id}`, kcal: Math.round(sum('kcal') / 5) * 5, proteinG: sum('proteinG'), carbsG: sum('carbsG'), fatG: sum('fatG'), fromPlan: true }
}

const fruta = fv('Fruta de temporada', 1, 'ud')
const aceite = (ml: number) => de('Aceite de oliva', ml, 'ml')
const ensalada = [fv('Lechuga', 60), fv('Tomate', 1, 'ud')]
const masa = pan('Masa quebrada', 0.25, 'ud')
const main: MealSlot[] = ['almuerzo', 'cena']

const list: PlanRecipe[] = [
  // Desayunos (2 vasos de agua en ayunas)
  {
    id: 'tostada-palta-huevo',
    name: 'Tostada de masa madre con palta, huevo revuelto y fruta',
    slots: ['desayuno'],
    minutes: 10,
    ingredients: [pan('Pan de masa madre o integral', 50), fv('Aguacate', 0.5, 'ud'), lh('Huevos', 1, 'ud'), fruta],
    steps: ['Tuesta el pan.', 'Haz el huevo revuelto en una sartén antiadherente.', 'Unta la palta, pon el huevo encima y acompaña con la fruta.'],
  },
  {
    id: 'omelette-queso',
    name: 'Omelette de 2 huevos con queso y fruta',
    slots: ['desayuno'],
    minutes: 10,
    ingredients: [lh('Huevos', 2, 'ud'), lh('Queso tierno (tipo port salut)', 60), fruta],
    steps: ['Bate los huevos y cuájalos en una sartén antiadherente.', 'Pon el queso en la mitad, dobla la omelette y deja que se funda.', 'Acompaña con la fruta.'],
  },
  {
    id: 'galletas-arroz-queso-huevo',
    name: 'Galletas de arroz con queso, huevo duro y fruta',
    slots: ['desayuno', 'merienda'],
    minutes: 12,
    ingredients: [de('Galletas de arroz', 2, 'ud'), lh('Queso tierno (tipo port salut)', 60), lh('Huevos', 1, 'ud'), fruta],
    steps: ['Cuece el huevo 10 minutos (puedes dejar varios hechos para la semana).', 'Pon una rodaja de queso en cada galleta y acompaña con el huevo y la fruta.'],
  },
  {
    id: 'galletas-arroz-ricota-huevo',
    name: 'Galletas de arroz con ricota, huevo duro y fruta',
    slots: ['desayuno', 'merienda'],
    minutes: 12,
    ingredients: [de('Galletas de arroz', 2, 'ud'), lh('Requesón (ricota)', 40), lh('Huevos', 1, 'ud'), fruta],
    steps: ['Cuece el huevo 10 minutos.', 'Unta una cucharada de ricota en cada galleta y acompaña con el huevo y la fruta.'],
  },
  {
    id: 'pancake-banana',
    name: 'Pancake de banana',
    slots: ['desayuno'],
    minutes: 15,
    ingredients: [lh('Huevos', 2, 'ud'), fv('Plátano', 1, 'ud'), de('Harina de almendra', 30)],
    steps: [
      'Pisa la banana y mézclala con los huevos, 4 cucharadas de harina de almendras o de coco, una pizca de polvo de hornear y esencia de vainilla.',
      'Cocina en una sartén antiadherente a fuego medio, 2 o 3 minutos por lado.',
      'Puedes cambiar la banana por la fruta que quieras.',
    ],
  },
  {
    id: 'yogur-frutos-secos',
    name: 'Yogur sin azúcar con frutos secos y fruta',
    slots: ['desayuno', 'merienda'],
    minutes: 3,
    ingredients: [lh('Yogur natural', 180), de('Nueces o almendras', 25), fruta],
    steps: ['Sirve el yogur con los frutos secos y la fruta troceada.'],
  },
  {
    id: 'yogur-granola',
    name: 'Yogur sin azúcar con granola y fruta',
    slots: ['desayuno'],
    minutes: 3,
    ingredients: [lh('Yogur natural', 180), de('Granola', 25), fruta],
    steps: ['Sirve el yogur con 2 cucharadas de granola y la fruta troceada.'],
  },
  {
    id: 'yogur-quinoa-pop',
    name: 'Yogur sin azúcar con quinoa pop y frutos rojos',
    slots: ['desayuno', 'merienda'],
    minutes: 3,
    ingredients: [lh('Yogur natural', 180), de('Quinoa inflada', 15), fv('Frutos rojos congelados', 100)],
    steps: ['Sirve el yogur con 2 cucharadas de quinoa pop y los frutos rojos (una taza tipo té).'],
  },

  // Meriendas (1 vaso de agua antes)
  {
    id: 'huevo-frutos-secos-fruta',
    name: 'Huevo duro, puñado de frutos secos y fruta',
    slots: ['merienda'],
    minutes: 10,
    ingredients: [lh('Huevos', 1, 'ud'), de('Nueces o almendras', 20), fruta],
    steps: ['Lleva un huevo duro, un puñado de frutos secos y una fruta o tomates cherry.'],
  },
  {
    id: 'yogur-fruta',
    name: 'Yogur sin azúcar con fruta',
    slots: ['merienda'],
    minutes: 2,
    ingredients: [lh('Yogur natural', 180), fruta],
    steps: ['Yogur con la fruta troceada.'],
  },
  {
    id: 'yogur-barrita',
    name: 'Yogur sin azúcar con barrita de cereal',
    slots: ['merienda'],
    minutes: 2,
    ingredients: [lh('Yogur natural', 180), de('Barrita de cereales', 1, 'ud')],
    steps: ['Yogur y una barrita de cereal. Puedes sumar una fruta.'],
  },
  {
    id: 'barrita-fruta',
    name: 'Barrita de cereal con fruta',
    slots: ['merienda'],
    minutes: 1,
    ingredients: [de('Barrita de cereales', 1, 'ud'), fruta],
    steps: ['Ideal para la oficina: una barrita de cereal y una fruta.'],
  },

  // Almuerzos y cenas con hidratos (1 vaso de agua 30 minutos antes)
  {
    id: 'milanesa-carne-ensalada',
    name: 'Milanesa de carne al horno con ensalada de lechuga y tomate',
    slots: main,
    minutes: 30,
    withCarbs: true,
    ingredients: [cp('Filete de ternera fino', 150), de('Pan rallado', 25), lh('Huevos', 0.5, 'ud'), ...ensalada, aceite(10)],
    steps: [
      'Pasa la carne por huevo batido y pan rallado.',
      'Hornea a 200 °C unos 20 minutos, dándole la vuelta a la mitad.',
      'Sirve con la ensalada aliñada con una cucharada de aceite. La milanesa ya es el hidrato: sin papa ni arroz.',
    ],
  },
  {
    id: 'milanesa-pollo-rucula',
    name: 'Milanesa de pollo con ensalada de rúcula y zanahoria',
    slots: main,
    minutes: 30,
    withCarbs: true,
    ingredients: [cp('Pechuga de pollo en filetes', 150), de('Pan rallado', 25), lh('Huevos', 0.5, 'ud'), fv('Rúcula', 40), fv('Zanahoria', 1, 'ud'), aceite(10)],
    steps: ['Empana el pollo con huevo y pan rallado.', 'Hornea a 200 °C unos 20 minutos.', 'Sirve con rúcula y zanahoria rallada aliñadas con aceite.'],
  },
  {
    id: 'milanesa-pollo-pure-zapallo',
    name: 'Milanesa de pollo con puré de zapallo',
    slots: main,
    minutes: 35,
    withCarbs: true,
    ingredients: [cp('Pechuga de pollo en filetes', 150), de('Pan rallado', 25), lh('Huevos', 0.5, 'ud'), fv('Calabaza', 250), aceite(5)],
    steps: ['Cuece la calabaza en dados al vapor o en el microondas y písala con el aceite, sal y nuez moscada.', 'Empana y hornea el pollo a 200 °C unos 20 minutos.'],
  },
  {
    id: 'pollo-papas-calabaza',
    name: 'Pechuga de pollo con papas y calabaza al horno',
    slots: main,
    minutes: 40,
    withCarbs: true,
    ingredients: [cp('Pechuga de pollo', 160), fv('Patata', 150), fv('Calabaza', 150), aceite(10)],
    steps: ['Corta la papa y la calabaza en gajos, aliña con aceite, sal y romero.', 'Hornea a 200 °C 35 minutos; a los 15 minutos añade el pollo.'],
  },
  {
    id: 'carne-papas-calabaza',
    name: 'Carne con papas y calabaza al horno',
    slots: main,
    minutes: 40,
    withCarbs: true,
    ingredients: [cp('Ternera para asar', 160), fv('Patata', 150), fv('Calabaza', 150), aceite(10)],
    steps: ['Hornea la papa y la calabaza en gajos con aceite a 200 °C 35 minutos.', 'Haz la carne a la plancha o al horno los últimos 10 minutos.'],
  },
  {
    id: 'merluza-papas-tomate',
    name: 'Filet de merluza con papas al horno y tomate con orégano',
    slots: main,
    minutes: 35,
    withCarbs: true,
    ingredients: [cp('Merluza en filetes', 180), fv('Patata', 150), fv('Tomate', 1, 'ud'), aceite(10)],
    steps: ['Hornea la papa en rodajas con la mitad del aceite a 200 °C 25 minutos.', 'Pon la merluza encima y hornea 10 minutos más.', 'Sirve con el tomate en rodajas, orégano y el resto del aceite.'],
  },
  {
    id: 'pollo-ensalada-choclo',
    name: 'Pechuga de pollo con ensalada de choclo, zanahoria y tomate',
    slots: main,
    minutes: 20,
    withCarbs: true,
    ingredients: [cp('Pechuga de pollo', 160), de('Maíz dulce', 80), fv('Zanahoria', 1, 'ud'), fv('Tomate', 1, 'ud'), aceite(10)],
    steps: ['Haz el pollo a la plancha.', 'Mezcla el choclo con la zanahoria rallada y el tomate, y aliña con aceite.'],
  },
  {
    id: 'wok-pollo-arroz',
    name: 'Wok de pollo, arroz integral y verduras',
    slots: main,
    minutes: 30,
    withCarbs: true,
    ingredients: [cp('Pechuga de pollo', 150), de('Arroz integral', 50), fv('Calabacín', 100), fv('Pimiento rojo', 80), fv('Berenjena', 80), fv('Cebolla', 50), aceite(10), de('Salsa de soja', 10, 'ml')],
    steps: ['Cuece el arroz (¼ de taza en crudo por persona).', 'Saltea a fuego fuerte el pollo en tiras con el aceite y retira.', 'Saltea la verdura en tiras, vuelve a poner el pollo, añade la soja y el arroz.'],
  },
  {
    id: 'ensalada-atun-quinoa',
    name: 'Ensalada de atún, quinoa, lechuga, palta y tomate',
    slots: main,
    minutes: 20,
    withCarbs: true,
    ingredients: [de('Atún al natural', 2, 'ud'), de('Quinoa', 50), fv('Lechuga', 60), fv('Aguacate', 0.5, 'ud'), fv('Tomate', 1, 'ud'), aceite(5)],
    steps: ['Cuece la quinoa 12 minutos y enfríala.', 'Mezcla con la lechuga, el tomate, la palta y el atún escurrido. Aliña con aceite.'],
  },
  {
    id: 'ensalada-atun-choclo-rucula',
    name: 'Ensalada de atún, choclo, rúcula y zanahoria',
    slots: main,
    minutes: 10,
    withCarbs: true,
    ingredients: [de('Atún al natural', 2, 'ud'), de('Maíz dulce', 80), fv('Rúcula', 40), fv('Zanahoria', 1, 'ud'), aceite(10)],
    steps: ['Mezcla todo con la zanahoria rallada y aliña con aceite.'],
  },
  {
    id: 'churrasquitos-arroz',
    name: 'Churrasquitos de carne con arroz integral y verduras salteadas',
    slots: main,
    minutes: 30,
    withCarbs: true,
    ingredients: [cp('Filete de ternera', 150), de('Arroz integral', 50), fv('Pimiento rojo', 80), fv('Zanahoria', 1, 'ud'), fv('Cebolla', 50), aceite(10)],
    steps: ['Cuece el arroz.', 'Saltea el morrón, la zanahoria y la cebolla en tiras con el aceite.', 'Haz la carne en tiras a la plancha y mezcla con el arroz y las verduras.'],
  },
  {
    id: 'tacos-pollo',
    name: 'Tacos de pollo y verduras',
    slots: main,
    minutes: 25,
    withCarbs: true,
    ingredients: [pan('Tortillas de maíz', 2, 'ud'), cp('Pechuga de pollo', 150), fv('Pimiento rojo', 80), fv('Cebolla', 60), fv('Tomate', 1, 'ud'), fv('Lechuga', 30), aceite(5)],
    steps: ['Saltea el pollo en tiras con la cebolla y el morrón, con pimentón y comino.', 'Calienta las tortillas y rellénalas con el pollo, tomate y lechuga.'],
  },
  {
    id: 'fideos-pollo-verduras',
    name: 'Fideos integrales con verduras y pollo en cubos',
    slots: main,
    minutes: 25,
    withCarbs: true,
    ingredients: [de('Pasta integral (tirabuzón)', 60), cp('Pechuga de pollo', 140), fv('Calabacín', 100), fv('Pimiento rojo', 60), fv('Cebolla', 40), aceite(10)],
    steps: ['Cuece los fideos (½ taza en crudo por persona).', 'Saltea el pollo en cubos y las verduras con el aceite.', 'Mezcla con los fideos.'],
  },

  // Tartas: ¼ de una tarta de una tapa, con ensalada
  {
    id: 'tarta-jamon-queso',
    name: 'Tarta de jamón y queso con ensalada',
    slots: main,
    minutes: 45,
    withCarbs: true,
    ingredients: [masa, cp('Jamón cocido', 40), lh('Queso tierno (tipo port salut)', 40), lh('Huevos', 0.5, 'ud'), lh('Leche desnatada', 30, 'ml'), ...ensalada, aceite(5)],
    steps: [
      'Forra un molde con la masa (una sola tapa) y pínchala con un tenedor.',
      'Reparte el jamón y el queso. Bate 2 huevos con 120 ml de leche, sal y pimienta, y viértelo encima.',
      'Hornea a 180 °C unos 30 minutos, hasta que cuaje. Una ración es ¼ de tarta.',
    ],
  },
  {
    id: 'tarta-zapallito',
    name: 'Tarta de zapallito con ensalada',
    slots: main,
    minutes: 50,
    withCarbs: true,
    ingredients: [masa, fv('Calabacín', 200), fv('Cebolla', 50), lh('Huevos', 1, 'ud'), lh('Queso rallado', 15), ...ensalada, aceite(5)],
    steps: [
      'Ralla o corta en cubos los zapallitos y rehógalos con la cebolla y el aceite hasta que suelten el agua.',
      'Mezcla con 4 huevos batidos y el queso rallado.',
      'Vierte sobre la masa (una tapa) y hornea a 180 °C unos 35 minutos. Una ración es ¼ de tarta.',
    ],
  },
  {
    id: 'pascualina',
    name: 'Pascualina con ensalada',
    slots: main,
    minutes: 55,
    withCarbs: true,
    ingredients: [masa, fv('Acelgas o espinacas', 200), fv('Cebolla', 40), lh('Huevos', 1, 'ud'), lh('Requesón (ricota)', 40), lh('Queso rallado', 10), ...ensalada, aceite(5)],
    steps: [
      'Saltea la cebolla con el aceite, añade la acelga o espinaca picada y cocina hasta que pierda el agua.',
      'Mezcla con la ricota, el queso rallado y sal. Ponlo sobre la masa (una tapa) y hunde 4 huevos enteros.',
      'Hornea a 180 °C unos 35 minutos. Una ración es ¼ de tarta. Si la haces con tapa arriba, suma unas 250 kcal por ración.',
    ],
  },
  {
    id: 'tarta-atun',
    name: 'Tarta de atún con ensalada',
    slots: main,
    minutes: 45,
    withCarbs: true,
    ingredients: [masa, de('Atún al natural', 1, 'ud'), fv('Cebolla', 40), fv('Pimiento rojo', 40), de('Tomate triturado', 40), lh('Huevos', 0.5, 'ud'), ...ensalada, aceite(5)],
    steps: [
      'Rehoga la cebolla y el morrón, añade el tomate y el atún escurrido.',
      'Fuera del fuego mezcla con 2 huevos batidos y ponlo sobre la masa (una tapa).',
      'Hornea a 180 °C unos 30 minutos. Una ración es ¼ de tarta.',
    ],
  },

  // Cenas sin hidratos: ½ verdura y ½ proteína (también valen de almuerzo)
  {
    id: 'pollo-verduras-horno',
    name: 'Pechuga de pollo con verduras al horno (zapallo, morrón y cebolla)',
    slots: main,
    minutes: 40,
    ingredients: [cp('Pechuga de pollo', 160), fv('Calabaza', 150), fv('Pimiento rojo', 100), fv('Cebolla', 80), aceite(10)],
    steps: ['Corta la verdura, aliña con aceite y sal y hornea a 200 °C 30 minutos.', 'Añade el pollo los últimos 15 minutos.'],
  },
  {
    id: 'pollo-revuelto-zapallitos',
    name: 'Pechuga de pollo con revuelto de zapallitos',
    slots: main,
    minutes: 25,
    ingredients: [cp('Pechuga de pollo', 150), fv('Calabacín', 200), fv('Zanahoria', 1, 'ud'), lh('Huevos', 1, 'ud'), aceite(5)],
    steps: ['Saltea el zapallito y la zanahoria en tiras con el aceite.', 'Añade el huevo batido y revuelve hasta que cuaje.', 'Sirve con el pollo a la plancha.'],
  },
  {
    id: 'solomillo-cerdo-ensalada',
    name: 'Solomillo de cerdo con ensalada de zanahoria y huevo',
    slots: main,
    minutes: 25,
    ingredients: [cp('Solomillo de cerdo', 160), fv('Zanahoria', 1, 'ud'), lh('Huevos', 1, 'ud'), fv('Lechuga', 50), aceite(10)],
    steps: ['Haz el solomillo a la plancha o al horno 15 minutos a 200 °C.', 'Sirve con la zanahoria rallada, la lechuga y el huevo duro, con aceite.'],
  },
  {
    id: 'merluza-verduras-horno',
    name: 'Filet de merluza con berenjena, zucchini y morrón al horno',
    slots: main,
    minutes: 35,
    ingredients: [cp('Merluza en filetes', 180), fv('Berenjena', 100), fv('Calabacín', 100), fv('Pimiento rojo', 80), aceite(10)],
    steps: ['Hornea la verdura en rodajas con el aceite a 200 °C 20 minutos.', 'Pon la merluza encima y hornea 10 minutos más.'],
  },
  {
    id: 'carne-pure-calabaza-zanahoria',
    name: 'Carne a la plancha con puré de calabaza y zanahoria',
    slots: main,
    minutes: 30,
    ingredients: [cp('Filete de ternera', 160), fv('Calabaza', 200), fv('Zanahoria', 1, 'ud'), aceite(5)],
    steps: ['Cuece la calabaza y la zanahoria y písalas con el aceite.', 'Haz la carne a la plancha.'],
  },
  {
    id: 'budin-atun',
    name: 'Budín de atún con ensalada de lechuga y tomate',
    slots: main,
    minutes: 40,
    ingredients: [de('Atún al natural', 2, 'ud'), lh('Huevos', 2, 'ud'), fv('Cebolla', 40), fv('Pimiento rojo', 40), lh('Queso rallado', 10), ...ensalada, aceite(5)],
    steps: ['Mezcla el atún escurrido con los huevos batidos, la cebolla y el morrón picados y el queso.', 'Hornea en un molde a 180 °C 25 a 30 minutos.', 'Sirve con la ensalada.'],
  },
  {
    id: 'omelette-atun-queso',
    name: 'Omelette de atún y queso con ensalada de repollo y zanahoria',
    slots: main,
    minutes: 15,
    ingredients: [lh('Huevos', 2, 'ud'), de('Atún al natural', 1, 'ud'), lh('Queso tierno (tipo port salut)', 30), fv('Repollo (col)', 100), fv('Zanahoria', 1, 'ud'), aceite(5)],
    steps: ['Cuaja los huevos batidos, rellena con el atún y el queso y dobla.', 'Sirve con el repollo en juliana y la zanahoria rallada, con aceite y limón.'],
  },
  {
    id: 'tacos-carne-verduras',
    name: 'Tacos de carne con verduras',
    slots: main,
    minutes: 25,
    withCarbs: true,
    ingredients: [pan('Tortillas de maíz', 2, 'ud'), cp('Carne picada de ternera', 130), fv('Pimiento rojo', 80), fv('Cebolla', 60), fv('Tomate', 1, 'ud'), aceite(5)],
    steps: ['Saltea la cebolla y el morrón, añade la carne con comino y pimentón.', 'Rellena las tortillas calientes con la carne y el tomate picado.'],
  },
  {
    id: 'pastel-zapallo',
    name: 'Pastel de zapallo',
    slots: main,
    minutes: 50,
    ingredients: [cp('Carne picada de ternera', 130), fv('Calabaza', 300), fv('Cebolla', 60), fv('Pimiento rojo', 40), lh('Queso rallado', 10), aceite(5)],
    steps: [
      'Cuece la calabaza y hazla puré.',
      'Sofríe la cebolla y el morrón con el aceite y añade la carne.',
      'Pon la carne en una fuente, cubre con el puré y el queso y gratina 15 minutos a 200 °C.',
    ],
  },
]

export const planRecipes: Recipe[] = list.map(planRecipe)
