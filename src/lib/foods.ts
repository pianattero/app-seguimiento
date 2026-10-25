import { normalize, parseIngredientLines, type Ingredient } from './recipes'

/**
 * Valores nutricionales aproximados por 100 g (o 100 ml) de alimentos habituales, en crudo salvo que diga
 * cocido. Fuente: tablas de composición (BEDCA/USDA), redondeados. `ud` son los gramos de una unidad típica.
 */
export interface Food {
  name: string
  /** Palabras que lo identifican, sin tildes; gana la más larga que aparezca en el ingrediente. */
  keys: string[]
  kcal: number
  p: number
  c: number
  f: number
  ud?: number
}

const food = (name: string, keys: string[], kcal: number, p: number, c: number, f: number, ud?: number): Food => ({ name, keys, kcal, p, c, f, ud })

export const foods: Food[] = [
  // Carnes y pescados
  food('Pechuga de pollo', ['pollo', 'pechuga de pollo', 'contramuslo'], 110, 23, 0, 1.5, 150),
  food('Pavo', ['pavo', 'pechuga de pavo'], 105, 24, 0, 1, 150),
  food('Pavo en lonchas', ['pavo en lonchas', 'fiambre de pavo', 'lonchas de pavo'], 95, 19, 2, 1.5, 15),
  food('Ternera magra', ['ternera', 'filete', 'solomillo'], 130, 22, 0, 4.5, 150),
  food('Carne picada mixta', ['carne picada', 'picada'], 220, 18, 0, 16),
  food('Cerdo (lomo)', ['cerdo', 'lomo'], 150, 21, 0, 7, 120),
  food('Jamón serrano', ['jamon serrano', 'jamon'], 240, 31, 0, 13, 15),
  food('Jamón cocido', ['jamon cocido', 'jamon york'], 110, 18, 1.5, 3.5, 15),
  food('Chorizo', ['chorizo'], 450, 24, 2, 38),
  food('Bacon', ['bacon', 'beicon'], 400, 14, 1, 38, 10),
  food('Salmón', ['salmon'], 200, 20, 0, 13, 125),
  food('Merluza', ['merluza', 'pescadilla'], 75, 16, 0, 1, 150),
  food('Bacalao', ['bacalao'], 80, 18, 0, 0.7, 150),
  food('Lubina / dorada', ['lubina', 'dorada'], 100, 19, 0, 2.5, 150),
  food('Atún fresco', ['atun fresco', 'bonito'], 130, 24, 0, 4),
  food('Atún en lata al natural', ['atun', 'atun al natural', 'lata de atun'], 105, 24, 0, 1, 56),
  food('Atún en aceite (escurrido)', ['atun en aceite'], 190, 26, 0, 9, 56),
  food('Sardinas en lata', ['sardina'], 210, 24, 0, 12, 85),
  food('Gambas / langostinos', ['gamba', 'langostino'], 90, 19, 0, 1.2, 15),
  food('Mejillones', ['mejillon'], 85, 12, 3, 2),
  food('Calamar', ['calamar', 'sepia', 'pota'], 80, 16, 1, 1),
  // Huevos y lácteos
  food('Huevo', ['huevo'], 145, 12.5, 0.7, 10, 55),
  food('Clara de huevo', ['clara'], 50, 11, 0.7, 0.2, 33),
  food('Leche desnatada', ['leche desnatada'], 35, 3.4, 4.9, 0.1),
  food('Leche semidesnatada', ['leche', 'leche semidesnatada'], 46, 3.2, 4.7, 1.6),
  food('Leche entera', ['leche entera'], 63, 3.1, 4.7, 3.6),
  food('Bebida de avena', ['bebida de avena', 'leche de avena'], 45, 0.5, 7.5, 1.4),
  food('Bebida de soja', ['bebida de soja', 'leche de soja'], 38, 3.3, 2.5, 1.8),
  food('Leche de coco light', ['leche de coco'], 75, 0.7, 2, 7),
  food('Yogur natural', ['yogur', 'yogurt'], 60, 4, 5, 3, 125),
  food('Yogur natural desnatado', ['yogur desnatado', 'yogur natural desnatado'], 40, 4.3, 5.5, 0.1, 125),
  food('Yogur griego', ['yogur griego'], 120, 6, 4, 9.5, 125),
  food('Yogur griego 0 %', ['yogur griego 0', 'griego 0', 'yogur griego desnatado'], 55, 10, 4, 0.2, 125),
  food('Skyr', ['skyr'], 63, 11, 4, 0.2, 150),
  food('Kéfir', ['kefir'], 55, 3.5, 4, 3),
  food('Queso fresco batido 0 %', ['queso batido', 'queso fresco batido'], 46, 8, 3.5, 0.1),
  food('Queso fresco', ['queso fresco', 'burgos'], 175, 12, 3, 13),
  food('Requesón', ['requeson'], 95, 11, 3.5, 4),
  food('Mozzarella', ['mozzarella'], 250, 18, 2, 19, 125),
  food('Mozzarella light', ['mozzarella light'], 165, 20, 1.5, 9, 125),
  food('Queso curado', ['queso curado', 'queso manchego', 'manchego'], 410, 26, 0.5, 34),
  food('Queso rallado / parmesano', ['parmesano', 'queso rallado', 'grana padano'], 400, 33, 0, 29),
  food('Queso de cabra', ['queso de cabra', 'rulo de cabra'], 300, 20, 1, 24),
  food('Quesitos light', ['quesito'], 130, 13, 6, 6, 16),
  food('Queso en lonchas', ['queso en lonchas', 'queso havarti', 'lonchas de queso'], 330, 23, 1, 26, 20),
  food('Mantequilla', ['mantequilla'], 740, 0.7, 0.6, 82),
  food('Nata para cocinar', ['nata'], 200, 2.5, 4, 19),
  // Cereales, pan y legumbres
  food('Arroz (crudo)', ['arroz'], 355, 7, 78, 0.7),
  food('Arroz cocido', ['arroz cocido', 'arroz hervido'], 130, 2.7, 28, 0.3),
  food('Pasta (cruda)', ['pasta', 'macarrones', 'espaguetis', 'spaghetti', 'tallarines', 'fideos', 'penne', 'fusilli', 'lasana'], 355, 12.5, 71, 1.5),
  food('Pasta cocida', ['pasta cocida'], 155, 5.5, 30, 0.9),
  food('Quinoa (cruda)', ['quinoa', 'quinua'], 365, 14, 64, 6),
  food('Cuscús (crudo)', ['cuscus', 'couscous'], 375, 13, 77, 0.6),
  food('Copos de avena', ['avena'], 375, 13.5, 59, 7),
  food('Muesli sin azúcar', ['muesli', 'granola'], 370, 10, 62, 7),
  food('Cereales de desayuno', ['cereales', 'corn flakes'], 380, 7, 84, 1),
  food('Pan blanco', ['pan', 'barra de pan', 'baguette'], 265, 9, 51, 3, 40),
  food('Pan integral', ['pan integral', 'pan de molde', 'tostada'], 250, 11, 43, 3.5, 35),
  food('Pan de hamburguesa', ['pan de hamburguesa'], 270, 9, 47, 5, 60),
  food('Tortilla de trigo', ['tortilla de trigo', 'tortillas de trigo', 'tortilla integral', 'wrap', 'fajita'], 300, 8.5, 50, 7, 40),
  food('Tortitas de arroz', ['tortita de arroz', 'tortitas de arroz'], 385, 8, 81, 3, 8),
  food('Harina de trigo', ['harina'], 350, 10, 74, 1.2),
  food('Pan rallado', ['pan rallado'], 365, 12, 72, 3),
  food('Patata', ['patata', 'papa'], 80, 2, 17, 0.1, 170),
  food('Boniato', ['boniato', 'batata'], 86, 1.6, 20, 0.1, 200),
  food('Garbanzos cocidos', ['garbanzo'], 140, 7.5, 18, 2.5),
  food('Lentejas cocidas', ['lenteja'], 115, 9, 17, 0.4),
  food('Alubias cocidas', ['alubia', 'judia blanca', 'frijol', 'judias rojas'], 105, 7, 16, 0.5),
  food('Lentejas secas', ['lentejas secas', 'lentejas crudas'], 335, 24, 49, 1.5),
  food('Garbanzos secos', ['garbanzos secos', 'garbanzos crudos'], 365, 19, 55, 6),
  food('Edamame', ['edamame'], 120, 11, 9, 5),
  food('Tofu', ['tofu'], 120, 13, 2, 7),
  food('Hummus', ['hummus', 'humus'], 250, 7, 14, 18),
  // Verduras
  food('Tomate', ['tomate'], 20, 0.9, 3.5, 0.2, 120),
  food('Tomate triturado', ['tomate triturado', 'salsa de tomate'], 35, 1.3, 6, 0.3),
  food('Tomate frito', ['tomate frito'], 75, 1.5, 9, 3.5),
  food('Lechuga / hojas verdes', ['lechuga', 'canonigo', 'rucula', 'brotes', 'ensalada'], 17, 1.3, 2, 0.2),
  food('Espinacas', ['espinaca', 'acelga', 'kale'], 23, 2.9, 1.5, 0.4),
  food('Cebolla', ['cebolla', 'cebolleta', 'chalota'], 38, 1.1, 8, 0.1, 110),
  food('Ajo', ['ajo', 'ajete'], 120, 6, 24, 0.5, 5),
  food('Pimiento', ['pimiento'], 25, 1, 5, 0.3, 150),
  food('Calabacín', ['calabacin'], 17, 1.2, 2.7, 0.3, 250),
  food('Berenjena', ['berenjena'], 24, 1, 4.5, 0.2, 300),
  food('Calabaza', ['calabaza'], 26, 1, 6, 0.1),
  food('Zanahoria', ['zanahoria'], 36, 0.9, 7.5, 0.2, 80),
  food('Brócoli', ['brocoli', 'coliflor', 'romanesco'], 34, 2.8, 4.5, 0.4),
  food('Judías verdes', ['judia verde', 'judias verdes'], 30, 2, 5, 0.2),
  food('Champiñones', ['champinon', 'seta', 'champiñon'], 22, 3, 2, 0.3),
  food('Pepino', ['pepino'], 13, 0.7, 2.2, 0.1, 200),
  food('Puerro', ['puerro'], 50, 1.5, 10, 0.3, 150),
  food('Espárragos', ['esparrago'], 22, 2.2, 2, 0.2, 20),
  food('Guisantes', ['guisante'], 80, 5.5, 11, 0.4),
  food('Maíz dulce', ['maiz'], 90, 3, 16, 1.2),
  food('Aguacate', ['aguacate'], 160, 2, 2, 15, 150),
  food('Aceitunas', ['aceituna', 'oliva negra'], 145, 1, 1, 15, 4),
  // Frutas
  food('Plátano', ['platano', 'banana'], 90, 1.1, 20, 0.3, 120),
  food('Manzana', ['manzana'], 52, 0.3, 12, 0.2, 180),
  food('Pera', ['pera'], 55, 0.4, 12, 0.1, 180),
  food('Naranja', ['naranja'], 45, 0.9, 9, 0.1, 200),
  food('Limón', ['limon', 'lima'], 30, 1, 6, 0.3, 100),
  food('Mandarina', ['mandarina', 'clementina'], 50, 0.8, 11, 0.3, 80),
  food('Kiwi', ['kiwi'], 60, 1.1, 12, 0.5, 75),
  food('Fresas', ['fresa', 'freson'], 33, 0.7, 6, 0.3, 15),
  food('Frutos rojos', ['frutos rojos', 'arandano', 'frambuesa', 'mora'], 50, 0.8, 10, 0.4),
  food('Melocotón', ['melocoton', 'nectarina'], 40, 0.9, 9, 0.3, 150),
  food('Piña', ['pina'], 50, 0.5, 11, 0.1),
  food('Mango', ['mango'], 60, 0.8, 14, 0.4, 300),
  food('Uvas', ['uva'], 70, 0.7, 16, 0.2),
  food('Sandía / melón', ['sandia', 'melon'], 32, 0.7, 7, 0.2),
  food('Dátiles', ['datil'], 280, 2.5, 67, 0.4, 8),
  // Grasas, frutos secos y otros
  food('Aceite de oliva', ['aceite'], 900, 0, 0, 100),
  food('Nueces', ['nuez', 'nueces'], 655, 15, 7, 65, 5),
  food('Almendras', ['almendra'], 600, 21, 9, 52, 1.2),
  food('Cacahuetes', ['cacahuete', 'mani'], 590, 26, 12, 49, 1),
  food('Anacardos', ['anacardo'], 580, 18, 27, 44),
  food('Crema de cacahuete', ['crema de cacahuete', 'mantequilla de cacahuete'], 600, 25, 14, 50),
  food('Semillas de chía', ['chia'], 490, 17, 8, 31),
  food('Semillas (lino, sésamo, girasol)', ['lino', 'sesamo', 'pipas', 'semillas de girasol', 'semillas de calabaza'], 560, 21, 12, 47),
  food('Tahini', ['tahini', 'tahin'], 600, 17, 10, 54),
  food('Chocolate negro 85 %', ['chocolate negro', 'chocolate'], 590, 10, 20, 50, 10),
  food('Cacao puro en polvo', ['cacao'], 360, 20, 13, 21),
  food('Miel', ['miel'], 305, 0.4, 82, 0, 21),
  food('Azúcar', ['azucar'], 400, 0, 100, 0, 5),
  food('Mayonesa', ['mayonesa'], 680, 1, 1, 75),
  food('Ketchup', ['ketchup'], 110, 1.2, 25, 0.1),
  food('Salsa de soja', ['soja'], 55, 8, 5, 0.1),
  food('Proteína en polvo (whey)', ['proteina en polvo', 'whey', 'scoop'], 380, 75, 8, 5, 30),
  food('Pizza (masa)', ['masa de pizza'], 270, 8, 50, 4),
  food('Caldo', ['caldo'], 5, 0.5, 0.5, 0.2),
]

/** Gramos por cucharada y cucharadita, para "1 cucharada de aceite". */
const spoonGrams: Record<string, number> = { cucharada: 12, cucharadas: 12, cda: 12, cdas: 12, cucharadita: 5, cucharaditas: 5, cdta: 5, cdtas: 5, puñado: 30, punado: 30, pizca: 0.5 }

export function findFood(name: string): Food | undefined {
  const text = ` ${normalize(name)} `
  let best: { food: Food; length: number } | undefined
  for (const f of foods) {
    for (const key of f.keys) {
      const k = normalize(key)
      // Coincide como palabra o inicio de palabra ("huevo" en "huevos", "platano" en "platanos").
      if (text.includes(` ${k}`) && (!best || k.length > best.length)) best = { food: f, length: k.length }
    }
  }
  return best?.food
}

export interface IngredientNutrition {
  ingredient: Ingredient
  food?: Food
  grams?: number
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

/** Kcal y macros de un ingrediente; sin alimento reconocido o sin gramos, cuenta 0 y se avisa. */
export function ingredientNutrition(ingredient: Ingredient, spoons?: { count: number; grams: number }): IngredientNutrition {
  const food = findFood(ingredient.name)
  const grams = spoons ? spoons.count * spoons.grams : ingredient.unit === 'ud' ? (food?.ud ? ingredient.qty * food.ud : undefined) : ingredient.qty
  if (!food || grams === undefined) return { ingredient, food, grams, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  const k = grams / 100
  return { ingredient, food, grams, kcal: food.kcal * k, proteinG: food.p * k, carbsG: food.c * k, fatG: food.f * k }
}

/** Lee ingredientes escritos a mano y suma sus kcal y macros. */
export function nutritionFromText(text: string): { lines: IngredientNutrition[]; kcal: number; proteinG: number; carbsG: number; fatG: number } {
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const parsed = parseIngredientLines(text)
  const lines = parsed.map((ingredient, i) => {
    // "1 cucharada de aceite": la unidad no la entiende el parser general, se resuelve aquí.
    const m = rawLines[i].match(/^(\d+(?:[.,]\d+)?|media|medio|una|un)\s+([a-zñ]+)\s+(?:de\s+)?(.+)$/i)
    const count = m ? ({ media: 0.5, medio: 0.5, una: 1, un: 1 } as Record<string, number>)[m[1].toLowerCase()] ?? Number(m[1].replace(',', '.')) : 0
    const spoon = m ? spoonGrams[normalize(m[2])] : undefined
    if (m && spoon) return ingredientNutrition({ ...ingredient, name: m[3].charAt(0).toUpperCase() + m[3].slice(1) }, { count, grams: spoon })
    return ingredientNutrition(ingredient)
  })
  const sum = (key: 'kcal' | 'proteinG' | 'carbsG' | 'fatG') => Math.round(lines.reduce((t, l) => t + l[key], 0))
  return { lines, kcal: sum('kcal'), proteinG: sum('proteinG'), carbsG: sum('carbsG'), fatG: sum('fatG') }
}
