import Foundation
import SwiftData

/// Rutina de fuerza asignada a un día de la semana (0 = lunes ... 6 = domingo).
@Model
final class RoutineTemplate {
    var weekdayIndex: Int
    var name: String
    var exerciseNames: [String]

    init(weekdayIndex: Int, name: String, exerciseNames: [String]) {
        self.weekdayIndex = weekdayIndex
        self.name = name
        self.exerciseNames = exerciseNames
    }
}
