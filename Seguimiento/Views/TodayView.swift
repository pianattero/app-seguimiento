import SwiftData
import SwiftUI

struct TodayView: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]
    @Query private var todaySessions: [TrainingSession]
    @State private var syncError: String?
    @State private var isSyncing = false

    init() {
        let today = WeekCalendar.calendar.startOfDay(for: .now)
        _todaySessions = Query(filter: #Predicate<TrainingSession> { $0.day == today }, sort: \.day)
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Entreno de hoy") {
                    if todaySessions.isEmpty {
                        Label("Descanso", systemImage: "bed.double")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(todaySessions) { session in
                        NavigationLink {
                            SessionDestination(session: session)
                        } label: {
                            SessionRow(session: session)
                        }
                    }
                }

                if let profile = profiles.first {
                    Section {
                        TargetRows(target: target(for: profile))
                    } header: {
                        Text("Objetivo de hoy")
                    } footer: {
                        Text("Calculado con tu metabolismo basal, el entreno de hoy y un déficit de \(Int(profile.deficitKcal)) kcal. El plan de comidas llega en la fase 3.")
                    }
                }
            }
            .navigationTitle(Format.dayTitle(.now))
            .toolbar {
                Button {
                    Task { await sync() }
                } label: {
                    if isSyncing { ProgressView() } else { Image(systemName: "arrow.triangle.2.circlepath") }
                }
                .disabled(isSyncing)
            }
            .refreshable { await sync() }
            .alert("No se pudo sincronizar", isPresented: Binding(get: { syncError != nil }, set: { if !$0 { syncError = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(syncError ?? "")
            }
        }
    }

    private func target(for profile: Profile) -> DayTarget {
        NutritionCalculator.dayTarget(
            for: profile.person,
            trainingKcal: NutritionCalculator.trainingKcal(for: todaySessions),
            deficitKcal: profile.deficitKcal,
            proteinPerKg: profile.proteinPerKg
        )
    }

    private func sync() async {
        isSyncing = true
        defer { isSyncing = false }
        do {
            try await WeekPlanner.sync(weekStart: WeekCalendar.startOfWeek(for: .now), context: context)
        } catch {
            syncError = error.localizedDescription
        }
    }
}

struct TargetRows: View {
    let target: DayTarget

    var body: some View {
        LabeledContent("Calorías", value: "\(target.kcal) kcal")
        LabeledContent("Proteína", value: "\(target.proteinG) g")
        LabeledContent("Hidratos", value: "\(target.carbsG) g")
        LabeledContent("Grasa", value: "\(target.fatG) g")
    }
}
