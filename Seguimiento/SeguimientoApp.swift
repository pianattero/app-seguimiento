import SwiftData
import SwiftUI

@main
struct SeguimientoApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: [Profile.self, RoutineTemplate.self, TrainingSession.self, StrengthSet.self])
    }
}
