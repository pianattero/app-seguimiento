import XCTest
@testable import Seguimiento

final class NutritionCalculatorTests: XCTestCase {
    private let pia = PersonData(sex: .female, ageYears: 27, weightKg: 88.5, heightCm: 170)
    private let partner = PersonData(sex: .male, ageYears: 30, weightKg: 90, heightCm: 172)

    func testBMRUsesMifflinStJeor() {
        XCTAssertEqual(NutritionCalculator.bmr(pia), 1651.5, accuracy: 0.01)
        XCTAssertEqual(NutritionCalculator.bmr(partner), 1830, accuracy: 0.01)
    }

    func testRestDayNeverGoesBelowFloor() {
        let target = NutritionCalculator.dayTarget(for: pia, trainingKcal: 0, deficitKcal: 500, proteinPerKg: 1.5)
        XCTAssertEqual(target.kcal, 1500)
    }

    func testTrainingDaysEatMore() {
        let strength = NutritionCalculator.dayTarget(for: pia, trainingKcal: 300, deficitKcal: 500, proteinPerKg: 1.5)
        let running = NutritionCalculator.dayTarget(for: pia, trainingKcal: 400, deficitKcal: 500, proteinPerKg: 1.5)
        XCTAssertEqual(strength.kcal, 1737)
        XCTAssertEqual(running.kcal, 1822)
    }

    func testMacrosAddUpToCalories() {
        let target = NutritionCalculator.dayTarget(for: pia, trainingKcal: 400, deficitKcal: 500, proteinPerKg: 1.5)
        XCTAssertEqual(target.proteinG, 133)
        let kcalFromMacros = target.proteinG * 4 + target.carbsG * 4 + target.fatG * 9
        XCTAssertEqual(Double(kcalFromMacros), Double(target.kcal), accuracy: 15)
    }

    func testPartnerPortionFactor() {
        XCTAssertEqual(NutritionCalculator.portionFactor(partner: partner, relativeTo: pia, deficitKcal: 500), 1.2, accuracy: 0.001)
    }
}
