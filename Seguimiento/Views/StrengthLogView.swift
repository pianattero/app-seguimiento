import SwiftData
import SwiftUI

struct StrengthLogView: View {
    @Environment(\.modelContext) private var context
    @Bindable var session: TrainingSession
    @Query private var routines: [RoutineTemplate]
    @State private var addedExercises: [String] = []
    @State private var newExerciseName = ""
    @State private var isAddingExercise = false

    var body: some View {
        List {
            if session.healthKitID != nil {
                Section("Apple Watch") {
                    if let seconds = session.durationSeconds {
                        LabeledContent("Tiempo", value: Format.duration(seconds))
                    }
                    if let kcal = session.activeKcal {
                        LabeledContent("Calorías activas", value: "\(Int(kcal.rounded())) kcal")
                    }
                    if let avg = session.avgHeartRate {
                        LabeledContent("Pulso medio", value: "\(Int(avg.rounded())) ppm")
                    }
                }
            }

            ForEach(exerciseNames, id: \.self) { name in
                Section {
                    let sets = session.orderedSets.filter { $0.exerciseName == name }
                    ForEach(Array(sets.enumerated()), id: \.element.persistentModelID) { index, set in
                        SetRow(set: set, number: index + 1)
                    }
                    .onDelete { offsets in
                        for offset in offsets { context.delete(sets[offset]) }
                    }
                    Button("Añadir serie", systemImage: "plus.circle") { addSet(for: name) }
                } header: {
                    HStack {
                        Text(name)
                        Spacer()
                        if let best = try? WeekPlanner.bestWeight(of: name, context: context), best > 0 {
                            Text("Récord \(Format.weight(best))")
                        }
                    }
                }
            }

            Section {
                Button("Añadir ejercicio", systemImage: "plus") { isAddingExercise = true }
            }
        }
        .navigationTitle(session.routineName ?? "Fuerza")
        .toolbar {
            Button(session.status == .done ? "Hecho ✓" : "Terminar") {
                session.status = .done
                try? context.save()
            }
            .disabled(session.status == .done)
        }
        .alert("Nuevo ejercicio", isPresented: $isAddingExercise) {
            TextField("Nombre", text: $newExerciseName)
            Button("Añadir") {
                let name = newExerciseName.trimmingCharacters(in: .whitespaces)
                if !name.isEmpty, !exerciseNames.contains(name) { addedExercises.append(name) }
                newExerciseName = ""
            }
            Button("Cancelar", role: .cancel) { newExerciseName = "" }
        }
    }

    /// Ejercicios de la rutina, más los que ya tienen series, más los añadidos ahora.
    private var exerciseNames: [String] {
        let routine = routines.first { $0.name == session.routineName }
            ?? routines.first { $0.weekdayIndex == WeekCalendar.weekdayIndex(of: session.day) }
        var names = routine?.exerciseNames ?? []
        for name in session.orderedSets.map(\.exerciseName) + addedExercises where !names.contains(name) {
            names.append(name)
        }
        return names
    }

    /// Nueva serie precargada con la anterior de esta sesión o, si no hay, con la última vez que hiciste el ejercicio.
    private func addSet(for name: String) {
        let previous = session.orderedSets.last { $0.exerciseName == name }
            ?? (try? WeekPlanner.lastSet(of: name, excluding: session, context: context))
        let set = StrengthSet(
            exerciseName: name,
            reps: previous?.reps ?? 10,
            weightKg: previous?.weightKg ?? 0,
            order: (session.sets.map(\.order).max() ?? -1) + 1
        )
        context.insert(set)
        set.session = session
        try? context.save()
    }
}

private struct SetRow: View {
    @Bindable var set: StrengthSet
    let number: Int

    var body: some View {
        HStack {
            Text("\(number)")
                .font(.headline)
                .frame(width: 24)
            Stepper("\(set.reps) reps", value: $set.reps, in: 1...50)
            TextField("kg", value: $set.weightKg, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 56)
            Text("kg").foregroundStyle(.secondary)
        }
    }
}
