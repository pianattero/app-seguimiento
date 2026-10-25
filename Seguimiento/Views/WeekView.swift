import SwiftData
import SwiftUI

struct WeekView: View {
    @Environment(\.modelContext) private var context
    @State private var weekStart = WeekCalendar.startOfWeek(for: .now)
    @State private var syncError: String?
    @State private var isSyncing = false

    var body: some View {
        NavigationStack {
            WeekSessionsList(weekStart: weekStart)
                .id(weekStart)
                .navigationTitle(Format.weekTitle(weekStart))
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItemGroup(placement: .topBarLeading) {
                        Button { weekStart = WeekCalendar.addingWeeks(-1, to: weekStart) } label: {
                            Image(systemName: "chevron.left")
                        }
                        Button { weekStart = WeekCalendar.addingWeeks(1, to: weekStart) } label: {
                            Image(systemName: "chevron.right")
                        }
                    }
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        Menu {
                            Button("Running extra hoy", systemImage: "figure.run") { addExtra(.running) }
                            Button("Fuerza extra hoy", systemImage: "dumbbell") { addExtra(.strength) }
                        } label: {
                            Image(systemName: "plus")
                        }
                        Button {
                            Task { await sync() }
                        } label: {
                            if isSyncing { ProgressView() } else { Image(systemName: "arrow.triangle.2.circlepath") }
                        }
                        .disabled(isSyncing)
                    }
                }
                .refreshable { await sync() }
                .task(id: weekStart) {
                    try? WeekPlanner.ensureWeek(startingAt: weekStart, context: context)
                }
                .alert("No se pudo sincronizar", isPresented: Binding(get: { syncError != nil }, set: { if !$0 { syncError = nil } })) {
                    Button("OK", role: .cancel) {}
                } message: {
                    Text(syncError ?? "")
                }
        }
    }

    private func addExtra(_ kind: SessionKind) {
        let today = WeekCalendar.calendar.startOfDay(for: .now)
        context.insert(TrainingSession(day: today, kind: kind, isExtra: true))
        try? context.save()
        weekStart = WeekCalendar.startOfWeek(for: today)
    }

    private func sync() async {
        isSyncing = true
        defer { isSyncing = false }
        do {
            try await WeekPlanner.sync(weekStart: weekStart, context: context)
        } catch {
            syncError = error.localizedDescription
        }
    }
}

private struct WeekSessionsList: View {
    @Environment(\.modelContext) private var context
    @Query private var sessions: [TrainingSession]
    private let weekStart: Date

    init(weekStart: Date) {
        self.weekStart = weekStart
        let weekEnd = WeekCalendar.addingWeeks(1, to: weekStart)
        _sessions = Query(filter: #Predicate<TrainingSession> { $0.day >= weekStart && $0.day < weekEnd }, sort: \.day)
    }

    var body: some View {
        List {
            Section {
                LabeledContent("Entrenos fijos hechos", value: "\(done.filter { !$0.isExtra }.count) de \(sessions.filter { !$0.isExtra }.count)")
                if done.contains(where: \.isExtra) {
                    LabeledContent("Extras", value: "\(done.filter(\.isExtra).count)")
                }
                LabeledContent("Kilómetros", value: Format.kilometers(done.compactMap(\.distanceMeters).reduce(0, +)))
                LabeledContent("Series de fuerza", value: "\(done.reduce(0) { $0 + $1.sets.count })")
            }

            ForEach(Array(WeekCalendar.days(ofWeekStarting: weekStart).enumerated()), id: \.offset) { index, day in
                Section(Format.dayTitle(day)) {
                    let daySessions = sessions.filter { $0.day == day }
                    if daySessions.isEmpty {
                        Text("Descanso").foregroundStyle(.secondary)
                    }
                    ForEach(daySessions) { session in
                        NavigationLink {
                            SessionDestination(session: session)
                        } label: {
                            SessionRow(session: session)
                        }
                        .swipeActions {
                            if session.isExtra {
                                Button("Borrar", role: .destructive) { context.delete(session) }
                            } else if session.status != .skipped {
                                Button("Saltado") { session.status = .skipped }.tint(.red)
                            } else {
                                Button("Pendiente") { session.status = .planned }
                            }
                        }
                    }
                }
            }
        }
    }

    private var done: [TrainingSession] {
        sessions.filter { $0.status == .done }
    }
}
