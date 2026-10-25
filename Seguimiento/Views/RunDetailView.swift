import SwiftUI

struct RunDetailView: View {
    @Bindable var session: TrainingSession

    var body: some View {
        List {
            if session.healthKitID == nil {
                Section {
                    Text("Todavía no hay datos del Apple Watch para este día. Graba el entreno con el Watch y pulsa sincronizar.")
                        .foregroundStyle(.secondary)
                }
            } else {
                Section("Apple Watch") {
                    if let meters = session.distanceMeters {
                        LabeledContent("Distancia", value: Format.kilometers(meters))
                    }
                    if let seconds = session.durationSeconds {
                        LabeledContent("Tiempo", value: Format.duration(seconds))
                    }
                    if let pace = session.paceSecondsPerKm {
                        LabeledContent("Ritmo medio", value: Format.pace(pace))
                    }
                    if let avg = session.avgHeartRate {
                        LabeledContent("Pulso medio", value: "\(Int(avg.rounded())) ppm")
                    }
                    if let max = session.maxHeartRate {
                        LabeledContent("Pulso máximo", value: "\(Int(max.rounded())) ppm")
                    }
                    if let kcal = session.activeKcal {
                        LabeledContent("Calorías activas", value: "\(Int(kcal.rounded())) kcal")
                    }
                }
            }

            Section("Estado") {
                Picker("Estado", selection: $session.statusRaw) {
                    ForEach(SessionStatus.allCases, id: \.rawValue) { status in
                        Text(status.label).tag(status.rawValue)
                    }
                }
                .pickerStyle(.segmented)
            }
        }
        .navigationTitle(session.isExtra ? "Running extra" : "Running")
    }
}
