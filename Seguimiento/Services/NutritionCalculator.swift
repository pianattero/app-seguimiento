import Foundation

struct PersonData: Equatable {
    var sex: Sex
    var ageYears: Int
    var weightKg: Double
    var heightCm: Double
}

struct DayTarget: Equatable {
    var kcal: Int
    var proteinG: Int
    var carbsG: Int
    var fatG: Int
}

/// Objetivos diarios: gasto en reposo + entreno del día − déficit.
enum NutritionCalculator {
    /// Factor de actividad sin contar el entreno (vida diaria sedentaria).
    static let baseActivityFactor = 1.2
    /// El Watch suele sobrestimar las kcal activas, así que solo se cuenta el 85 %.
    static let watchCorrection = 0.85
    /// Nunca se baja de este mínimo, para no comprometer los entrenos.
    static func floorKcal(for sex: Sex) -> Double { sex == .female ? 1500 : 1800 }
    static let fatShareOfKcal = 0.28

    /// Estimación de kcal activas cuando aún no hay dato del Watch.
    static func estimatedKcal(for kind: SessionKind) -> Double {
        switch kind {
        case .strength: 300
        case .running: 400
        }
    }

    /// Metabolismo basal, fórmula Mifflin-St Jeor.
    static func bmr(_ person: PersonData) -> Double {
        let base = 10 * person.weightKg + 6.25 * person.heightCm - 5 * Double(person.ageYears)
        return base + (person.sex == .female ? -161 : 5)
    }

    static func maintenanceKcal(_ person: PersonData, trainingKcal: Double) -> Double {
        bmr(person) * baseActivityFactor + watchCorrection * trainingKcal
    }

    static func dayTarget(for person: PersonData, trainingKcal: Double, deficitKcal: Double, proteinPerKg: Double) -> DayTarget {
        let kcal = max(maintenanceKcal(person, trainingKcal: trainingKcal) - deficitKcal, floorKcal(for: person.sex))
        let protein = proteinPerKg * person.weightKg
        let fat = kcal * fatShareOfKcal / 9
        let carbs = max((kcal - protein * 4 - fat * 9) / 4, 0)
        return DayTarget(
            kcal: Int(kcal.rounded()),
            proteinG: Int(protein.rounded()),
            carbsG: Int(carbs.rounded()),
            fatG: Int(fat.rounded())
        )
    }

    /// Raciones de la segunda persona por cada ración de la usuaria, comparando sus días de descanso.
    static func portionFactor(partner: PersonData, relativeTo person: PersonData, deficitKcal: Double) -> Double {
        let mine = dayTarget(for: person, trainingKcal: 0, deficitKcal: deficitKcal, proteinPerKg: 1.5).kcal
        let theirs = dayTarget(for: partner, trainingKcal: 0, deficitKcal: deficitKcal, proteinPerKg: 1.5).kcal
        return (Double(theirs) / Double(mine) * 10).rounded() / 10
    }

    /// kcal de entreno de un día: lo medido por el Watch si existe, si no la estimación de lo previsto.
    static func trainingKcal(for sessions: [TrainingSession]) -> Double {
        sessions
            .filter { $0.status != .skipped }
            .reduce(0) { total, session in
                total + (session.activeKcal ?? estimatedKcal(for: session.kind))
            }
    }
}
