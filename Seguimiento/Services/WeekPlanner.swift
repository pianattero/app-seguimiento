import Foundation
import SwiftData

/// Crea las sesiones previstas de cada semana y les asigna los entrenos del Watch.
@MainActor
enum WeekPlanner {
    static let defaultRoutines: [(weekdayIndex: Int, name: String, exercises: [String])] = [
        (0, "Fuerza A", ["Sentadilla", "Press banca", "Remo con mancuerna", "Hip thrust", "Plancha"]),
        (2, "Fuerza B", ["Peso muerto rumano", "Press militar", "Jalón al pecho", "Zancadas", "Elevaciones de gemelo"]),
    ]

    static func seedIfNeeded(_ context: ModelContext) throws {
        if try context.fetchCount(FetchDescriptor<Profile>()) == 0 {
            context.insert(Profile())
        }
        if try context.fetchCount(FetchDescriptor<RoutineTemplate>()) == 0 {
            for routine in defaultRoutines {
                context.insert(RoutineTemplate(weekdayIndex: routine.weekdayIndex, name: routine.name, exerciseNames: routine.exercises))
            }
        }
        try context.save()
    }

    static func sessions(inWeekStarting weekStart: Date, context: ModelContext) throws -> [TrainingSession] {
        let weekEnd = WeekCalendar.addingWeeks(1, to: weekStart)
        let descriptor = FetchDescriptor<TrainingSession>(
            predicate: #Predicate { $0.day >= weekStart && $0.day < weekEnd },
            sortBy: [SortDescriptor(\.day)]
        )
        return try context.fetch(descriptor)
    }

    /// Añade las sesiones de la plantilla que falten en la semana.
    static func ensureWeek(startingAt weekStart: Date, context: ModelContext) throws {
        let existing = try sessions(inWeekStarting: weekStart, context: context)
        let routines = try context.fetch(FetchDescriptor<RoutineTemplate>())
        for (index, day) in WeekCalendar.days(ofWeekStarting: weekStart).enumerated() {
            guard let kind = WeekTemplate.plannedKind(forWeekdayIndex: index) else { continue }
            let alreadyPlanned = existing.contains { $0.day == day && $0.kind == kind && !$0.isExtra }
            if alreadyPlanned { continue }
            let routineName = kind == .strength ? routines.first { $0.weekdayIndex == index }?.name : nil
            context.insert(TrainingSession(day: day, kind: kind, routineName: routineName))
        }
        try context.save()
    }

    /// Asigna cada entreno del Watch a la sesión prevista de ese día y tipo; si no hay, crea un extra.
    static func merge(_ workouts: [ImportedWorkout], weekStart: Date, context: ModelContext) throws {
        var sessions = try sessions(inWeekStarting: weekStart, context: context)
        let calendar = WeekCalendar.calendar
        for workout in workouts {
            if let linked = sessions.first(where: { $0.healthKitID == workout.id }) {
                linked.apply(workout)
                continue
            }
            let day = calendar.startOfDay(for: workout.start)
            if let planned = sessions.first(where: { $0.day == day && $0.kind == workout.kind && $0.healthKitID == nil }) {
                planned.apply(workout)
            } else {
                let extra = TrainingSession(day: day, kind: workout.kind, isExtra: true)
                extra.apply(workout)
                context.insert(extra)
                sessions.append(extra)
            }
        }
        try context.save()
    }

    /// Última serie registrada de un ejercicio, fuera de la sesión actual, para precargar el peso.
    static func lastSet(of exerciseName: String, excluding session: TrainingSession, context: ModelContext) throws -> StrengthSet? {
        var descriptor = FetchDescriptor<StrengthSet>(
            predicate: #Predicate { $0.exerciseName == exerciseName },
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 30
        return try context.fetch(descriptor).first { $0.session?.persistentModelID != session.persistentModelID }
    }

    /// Mejor peso levantado por ejercicio.
    static func bestWeight(of exerciseName: String, context: ModelContext) throws -> Double? {
        var descriptor = FetchDescriptor<StrengthSet>(
            predicate: #Predicate { $0.exerciseName == exerciseName },
            sortBy: [SortDescriptor(\.weightKg, order: .reverse)]
        )
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first?.weightKg
    }
}

extension WeekPlanner {
    /// Crea la semana si falta, pide permiso a Salud e importa los entrenos del Watch.
    static func sync(weekStart: Date, context: ModelContext, healthKit: HealthKitService = .shared) async throws {
        try ensureWeek(startingAt: weekStart, context: context)
        try await healthKit.requestAuthorization()
        let workouts = try await healthKit.workouts(from: weekStart, to: WeekCalendar.addingWeeks(1, to: weekStart))
        try merge(workouts, weekStart: weekStart, context: context)
    }
}
