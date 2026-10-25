import Foundation
import SwiftData

enum SessionKind: String, Codable, CaseIterable {
    case strength
    case running

    var label: String { self == .strength ? "Fuerza" : "Running" }
    var symbol: String { self == .strength ? "dumbbell.fill" : "figure.run" }
}

enum SessionStatus: String, Codable, CaseIterable {
    case planned
    case done
    case skipped

    var label: String {
        switch self {
        case .planned: "Pendiente"
        case .done: "Hecho"
        case .skipped: "Saltado"
        }
    }
}

/// Un entreno de la semana: previsto por la plantilla, o extra importado del Watch.
@Model
final class TrainingSession {
    /// Inicio del día al que pertenece la sesión.
    var day: Date
    var kindRaw: String
    var statusRaw: String
    var isExtra: Bool
    var routineName: String?

    // Datos del Apple Watch (vía HealthKit)
    var healthKitID: UUID?
    var startedAt: Date?
    var durationSeconds: Double?
    var distanceMeters: Double?
    var activeKcal: Double?
    var avgHeartRate: Double?
    var maxHeartRate: Double?

    @Relationship(deleteRule: .cascade, inverse: \StrengthSet.session)
    var sets: [StrengthSet] = []

    init(day: Date, kind: SessionKind, status: SessionStatus = .planned, isExtra: Bool = false, routineName: String? = nil) {
        self.day = day
        self.kindRaw = kind.rawValue
        self.statusRaw = status.rawValue
        self.isExtra = isExtra
        self.routineName = routineName
    }

    var kind: SessionKind {
        get { SessionKind(rawValue: kindRaw) ?? .running }
        set { kindRaw = newValue.rawValue }
    }

    var status: SessionStatus {
        get { SessionStatus(rawValue: statusRaw) ?? .planned }
        set { statusRaw = newValue.rawValue }
    }

    var orderedSets: [StrengthSet] {
        sets.sorted { $0.order < $1.order }
    }

    /// Ritmo medio en segundos por km.
    var paceSecondsPerKm: Double? {
        guard let durationSeconds, let distanceMeters, distanceMeters > 0 else { return nil }
        return durationSeconds / (distanceMeters / 1000)
    }

    func apply(_ workout: ImportedWorkout) {
        healthKitID = workout.id
        startedAt = workout.start
        durationSeconds = workout.duration
        distanceMeters = workout.distanceMeters
        activeKcal = workout.activeKcal
        avgHeartRate = workout.avgHeartRate
        maxHeartRate = workout.maxHeartRate
        status = .done
    }
}

/// Una serie de un ejercicio de fuerza.
@Model
final class StrengthSet {
    var exerciseName: String
    var reps: Int
    var weightKg: Double
    var order: Int
    var createdAt: Date
    var session: TrainingSession?

    init(exerciseName: String, reps: Int, weightKg: Double, order: Int, createdAt: Date = .now) {
        self.exerciseName = exerciseName
        self.reps = reps
        self.weightKg = weightKg
        self.order = order
        self.createdAt = createdAt
    }
}
