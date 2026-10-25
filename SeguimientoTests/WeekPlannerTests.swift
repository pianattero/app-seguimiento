import SwiftData
import XCTest
@testable import Seguimiento

@MainActor
final class WeekPlannerTests: XCTestCase {
    private var container: ModelContainer!
    private var context: ModelContext { container.mainContext }
    // Lunes 26 de octubre de 2026
    private let monday = WeekCalendar.calendar.date(from: DateComponents(year: 2026, month: 10, day: 26))!

    override func setUp() async throws {
        container = try ModelContainer(
            for: Profile.self, RoutineTemplate.self, TrainingSession.self, StrengthSet.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        try WeekPlanner.seedIfNeeded(context)
    }

    func testWeekStartsOnMonday() {
        let thursday = WeekCalendar.calendar.date(byAdding: .day, value: 3, to: monday)!
        XCTAssertEqual(WeekCalendar.startOfWeek(for: thursday), monday)
        XCTAssertEqual(WeekCalendar.weekdayIndex(of: monday), 0)
    }

    func testEnsureWeekCreatesFixedPlanOnce() throws {
        try WeekPlanner.ensureWeek(startingAt: monday, context: context)
        try WeekPlanner.ensureWeek(startingAt: monday, context: context)
        let sessions = try WeekPlanner.sessions(inWeekStarting: monday, context: context)
        XCTAssertEqual(sessions.map(\.kind), [.strength, .running, .strength, .running])
        XCTAssertEqual(sessions.first?.routineName, "Fuerza A")
    }

    func testMergeLinksPlannedAndCreatesExtras() throws {
        try WeekPlanner.ensureWeek(startingAt: monday, context: context)
        let tuesday = WeekCalendar.calendar.date(byAdding: .hour, value: 24 + 19, to: monday)!
        let saturday = WeekCalendar.calendar.date(byAdding: .hour, value: 5 * 24 + 10, to: monday)!
        let tuesdayRun = ImportedWorkout(id: UUID(), start: tuesday, kind: .running, duration: 1800, distanceMeters: 5000, activeKcal: 380, avgHeartRate: 155, maxHeartRate: 172)
        let saturdayRun = ImportedWorkout(id: UUID(), start: saturday, kind: .running, duration: 2400, distanceMeters: 7000, activeKcal: 500, avgHeartRate: 150, maxHeartRate: 168)

        try WeekPlanner.merge([tuesdayRun, saturdayRun], weekStart: monday, context: context)
        try WeekPlanner.merge([tuesdayRun, saturdayRun], weekStart: monday, context: context)

        let sessions = try WeekPlanner.sessions(inWeekStarting: monday, context: context)
        XCTAssertEqual(sessions.count, 5)
        let planned = sessions.first { $0.healthKitID == tuesdayRun.id }
        XCTAssertEqual(planned?.isExtra, false)
        XCTAssertEqual(planned?.status, .done)
        XCTAssertEqual(planned?.paceSecondsPerKm ?? 0, 360, accuracy: 0.01)
        XCTAssertEqual(sessions.first { $0.healthKitID == saturdayRun.id }?.isExtra, true)
    }

    func testLastSetPrefillsFromPreviousSession() throws {
        let previous = TrainingSession(day: monday, kind: .strength)
        let today = TrainingSession(day: WeekCalendar.addingWeeks(1, to: monday), kind: .strength)
        context.insert(previous)
        context.insert(today)
        let set = StrengthSet(exerciseName: "Sentadilla", reps: 8, weightKg: 40, order: 0)
        context.insert(set)
        set.session = previous
        try context.save()

        let last = try WeekPlanner.lastSet(of: "Sentadilla", excluding: today, context: context)
        XCTAssertEqual(last?.weightKg, 40)
        XCTAssertNil(try WeekPlanner.lastSet(of: "Sentadilla", excluding: previous, context: context))
    }
}
