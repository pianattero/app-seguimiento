import Foundation
import SwiftData

enum Sex: String, Codable, CaseIterable {
    case female
    case male

    var label: String { self == .female ? "Mujer" : "Hombre" }
}

/// Datos de la usuaria y de la segunda persona que come el mismo menú.
@Model
final class Profile {
    var name: String
    var sexRaw: String
    var ageYears: Int
    var weightKg: Double
    var heightCm: Double
    /// Déficit diario objetivo en kcal.
    var deficitKcal: Double
    /// Proteína diaria en gramos por kg de peso.
    var proteinPerKg: Double

    var partnerName: String
    var partnerSexRaw: String
    var partnerAgeYears: Int
    var partnerWeightKg: Double
    var partnerHeightCm: Double
    /// Raciones de la segunda persona por cada ración de la usuaria.
    var partnerPortionFactor: Double

    init(
        name: String = "Pia",
        sex: Sex = .female,
        ageYears: Int = 27,
        weightKg: Double = 88.5,
        heightCm: Double = 170,
        deficitKcal: Double = 500,
        proteinPerKg: Double = 1.5,
        partnerName: String = "Acompañante",
        partnerSex: Sex = .male,
        partnerAgeYears: Int = 30,
        partnerWeightKg: Double = 90,
        partnerHeightCm: Double = 172,
        partnerPortionFactor: Double = 1.2
    ) {
        self.name = name
        self.sexRaw = sex.rawValue
        self.ageYears = ageYears
        self.weightKg = weightKg
        self.heightCm = heightCm
        self.deficitKcal = deficitKcal
        self.proteinPerKg = proteinPerKg
        self.partnerName = partnerName
        self.partnerSexRaw = partnerSex.rawValue
        self.partnerAgeYears = partnerAgeYears
        self.partnerWeightKg = partnerWeightKg
        self.partnerHeightCm = partnerHeightCm
        self.partnerPortionFactor = partnerPortionFactor
    }

    var sex: Sex {
        get { Sex(rawValue: sexRaw) ?? .female }
        set { sexRaw = newValue.rawValue }
    }

    var partnerSex: Sex {
        get { Sex(rawValue: partnerSexRaw) ?? .male }
        set { partnerSexRaw = newValue.rawValue }
    }

    var person: PersonData {
        PersonData(sex: sex, ageYears: ageYears, weightKg: weightKg, heightCm: heightCm)
    }

    var partner: PersonData {
        PersonData(sex: partnerSex, ageYears: partnerAgeYears, weightKg: partnerWeightKg, heightCm: partnerHeightCm)
    }
}
