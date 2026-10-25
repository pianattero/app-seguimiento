import Foundation
import HealthKit

/// Un entreno leído de Apple Salud (grabado por el Apple Watch).
struct ImportedWorkout: Equatable {
    let id: UUID
    let start: Date
    let kind: SessionKind
    let duration: TimeInterval
    let distanceMeters: Double?
    let activeKcal: Double?
    let avgHeartRate: Double?
    let maxHeartRate: Double?
}

enum HealthKitError: LocalizedError {
    case unavailable

    var errorDescription: String? {
        "Apple Salud no está disponible en este dispositivo."
    }
}

final class HealthKitService {
    static let shared = HealthKitService()

    private let store = HKHealthStore()

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    /// Pide permiso de lectura una sola vez. Incluye peso y ciclo para las siguientes fases.
    func requestAuthorization() async throws {
        guard isAvailable else { throw HealthKitError.unavailable }
        let read: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
            HKQuantityType(.distanceWalkingRunning),
            HKQuantityType(.bodyMass),
            HKCategoryType(.menstrualFlow),
        ]
        try await store.requestAuthorization(toShare: [], read: read)
    }

    /// Entrenos de running y fuerza entre dos fechas.
    func workouts(from start: Date, to end: Date) async throws -> [ImportedWorkout] {
        guard isAvailable else { throw HealthKitError.unavailable }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.workout(predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)]
        )
        let workouts = try await descriptor.result(for: store)
        return workouts.compactMap(Self.makeImported)
    }

    static func kind(for type: HKWorkoutActivityType) -> SessionKind? {
        switch type {
        case .running: .running
        case .traditionalStrengthTraining, .functionalStrengthTraining: .strength
        default: nil
        }
    }

    private static func makeImported(_ workout: HKWorkout) -> ImportedWorkout? {
        guard let kind = kind(for: workout.workoutActivityType) else { return nil }
        let bpm = HKUnit.count().unitDivided(by: .minute())
        let heartRate = workout.statistics(for: HKQuantityType(.heartRate))
        return ImportedWorkout(
            id: workout.uuid,
            start: workout.startDate,
            kind: kind,
            duration: workout.duration,
            distanceMeters: workout.statistics(for: HKQuantityType(.distanceWalkingRunning))?
                .sumQuantity()?.doubleValue(for: .meter()),
            activeKcal: workout.statistics(for: HKQuantityType(.activeEnergyBurned))?
                .sumQuantity()?.doubleValue(for: .kilocalorie()),
            avgHeartRate: heartRate?.averageQuantity()?.doubleValue(for: bpm),
            maxHeartRate: heartRate?.maximumQuantity()?.doubleValue(for: bpm)
        )
    }
}
