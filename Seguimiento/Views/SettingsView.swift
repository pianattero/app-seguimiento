import SwiftData
import SwiftUI

struct SettingsView: View {
    @Query private var profiles: [Profile]
    @Query(sort: \RoutineTemplate.weekdayIndex) private var routines: [RoutineTemplate]
    @State private var healthMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                if let profile = profiles.first {
                    ProfileForm(profile: profile)
                }

                Section("Rutinas de fuerza") {
                    ForEach(routines) { routine in
                        NavigationLink {
                            RoutineEditor(routine: routine)
                        } label: {
                            LabeledContent(routine.name, value: WeekTemplate.weekdayNames[routine.weekdayIndex])
                        }
                    }
                }

                Section {
                    Button("Dar permiso a Apple Salud", systemImage: "heart.text.square") {
                        Task {
                            do {
                                try await HealthKitService.shared.requestAuthorization()
                                healthMessage = "Listo. Si no ves tus entrenos, revisa Ajustes > Salud > Acceso a datos > Seguimiento."
                            } catch {
                                healthMessage = error.localizedDescription
                            }
                        }
                    }
                } header: {
                    Text("Apple Watch")
                } footer: {
                    if let healthMessage { Text(healthMessage) }
                }
            }
            .navigationTitle("Ajustes")
        }
    }
}

private struct ProfileForm: View {
    @Bindable var profile: Profile

    var body: some View {
        Section("Tus datos") {
            Stepper("Edad: \(profile.ageYears)", value: $profile.ageYears, in: 14...90)
            NumberField(title: "Peso (kg)", value: $profile.weightKg)
            NumberField(title: "Altura (cm)", value: $profile.heightCm)
        }

        Section {
            Picker("Déficit diario", selection: $profile.deficitKcal) {
                ForEach([300.0, 400, 500, 600], id: \.self) { kcal in
                    Text("\(Int(kcal)) kcal").tag(kcal)
                }
            }
            Stepper(
                "Proteína: \(profile.proteinPerKg.formatted(.number.precision(.fractionLength(1)))) g/kg",
                value: $profile.proteinPerKg, in: 1.2...2.2, step: 0.1
            )
            LabeledContent("Metabolismo basal", value: "\(Int(NutritionCalculator.bmr(profile.person))) kcal")
            LabeledContent("Día de descanso", value: "\(target(training: []).kcal) kcal")
            LabeledContent("Día de fuerza", value: "\(target(training: [.strength]).kcal) kcal")
            LabeledContent("Día de running", value: "\(target(training: [.running]).kcal) kcal")
        } header: {
            Text("Objetivo")
        } footer: {
            Text("500 kcal de déficit equivale a perder unos 0,5 kg por semana. La app nunca baja de \(Int(NutritionCalculator.floorKcal(for: profile.sex))) kcal para no comprometer los entrenos.")
        }

        Section {
            TextField("Nombre", text: $profile.partnerName)
            Stepper("Edad: \(profile.partnerAgeYears)", value: $profile.partnerAgeYears, in: 14...90)
            NumberField(title: "Peso (kg)", value: $profile.partnerWeightKg)
            NumberField(title: "Altura (cm)", value: $profile.partnerHeightCm)
            Stepper(
                "Raciones: \(profile.partnerPortionFactor.formatted(.number.precision(.fractionLength(1)))) por cada una tuya",
                value: $profile.partnerPortionFactor, in: 0.5...2, step: 0.1
            )
            LabeledContent("Sugerido según sus datos", value: suggestedFactor.formatted(.number.precision(.fractionLength(1))))
        } header: {
            Text("Segunda persona")
        } footer: {
            Text("El menú se cocina para los dos y se reparte con este factor.")
        }
    }

    private func target(training kinds: [SessionKind]) -> DayTarget {
        NutritionCalculator.dayTarget(
            for: profile.person,
            trainingKcal: kinds.reduce(0) { $0 + NutritionCalculator.estimatedKcal(for: $1) },
            deficitKcal: profile.deficitKcal,
            proteinPerKg: profile.proteinPerKg
        )
    }

    private var suggestedFactor: Double {
        NutritionCalculator.portionFactor(
            partner: profile.partner,
            relativeTo: profile.person,
            deficitKcal: profile.deficitKcal
        )
    }
}

private struct NumberField: View {
    let title: String
    @Binding var value: Double

    var body: some View {
        LabeledContent(title) {
            TextField(title, value: $value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
        }
    }
}

private struct RoutineEditor: View {
    @Bindable var routine: RoutineTemplate
    @State private var newExercise = ""

    var body: some View {
        List {
            Section("Nombre") {
                TextField("Nombre", text: $routine.name)
            }
            Section("Ejercicios") {
                ForEach(routine.exerciseNames, id: \.self) { Text($0) }
                    .onDelete { routine.exerciseNames.remove(atOffsets: $0) }
                    .onMove { routine.exerciseNames.move(fromOffsets: $0, toOffset: $1) }
                HStack {
                    TextField("Nuevo ejercicio", text: $newExercise)
                    Button("Añadir") {
                        let name = newExercise.trimmingCharacters(in: .whitespaces)
                        guard !name.isEmpty, !routine.exerciseNames.contains(name) else { return }
                        routine.exerciseNames.append(name)
                        newExercise = ""
                    }
                }
            }
        }
        .navigationTitle(WeekTemplate.weekdayNames[routine.weekdayIndex])
        .toolbar { EditButton() }
    }
}
