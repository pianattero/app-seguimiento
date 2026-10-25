import SwiftUI

struct ProgressPlaceholderView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Llega en la fase 2",
                systemImage: "chart.line.uptrend.xyaxis",
                description: Text("Aquí verás tus kilómetros por semana, el ritmo, el volumen de fuerza, tus récords y tu peso.")
            )
            .navigationTitle("Progreso")
        }
    }
}
