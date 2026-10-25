import SwiftData
import SwiftUI

struct RootView: View {
    @Environment(\.modelContext) private var context

    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("Hoy", systemImage: "sun.max") }
            WeekView()
                .tabItem { Label("Entrenos", systemImage: "figure.run") }
            ProgressPlaceholderView()
                .tabItem { Label("Progreso", systemImage: "chart.line.uptrend.xyaxis") }
            SettingsView()
                .tabItem { Label("Ajustes", systemImage: "gearshape") }
        }
        .task {
            try? WeekPlanner.seedIfNeeded(context)
            try? WeekPlanner.ensureWeek(startingAt: WeekCalendar.startOfWeek(for: .now), context: context)
        }
    }
}

/// Abre el registro de fuerza o el detalle de running según el tipo de sesión.
struct SessionDestination: View {
    let session: TrainingSession

    var body: some View {
        switch session.kind {
        case .strength: StrengthLogView(session: session)
        case .running: RunDetailView(session: session)
        }
    }
}

struct SessionRow: View {
    let session: TrainingSession

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: session.kind.symbol)
                .font(.title3)
                .frame(width: 32)
                .foregroundStyle(session.kind == .strength ? Color.orange : Color.green)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold))
                if let detail {
                    Text(detail).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            Spacer()
            StatusBadge(status: session.status)
        }
    }

    private var title: String {
        var text = session.kind.label
        if let routine = session.routineName { text += " · \(routine)" }
        if session.isExtra { text += " · extra" }
        return text
    }

    private var detail: String? {
        switch session.kind {
        case .running:
            guard let meters = session.distanceMeters else { return nil }
            var parts = [Format.kilometers(meters)]
            if let pace = session.paceSecondsPerKm { parts.append(Format.pace(pace)) }
            return parts.joined(separator: " · ")
        case .strength:
            let exercises = Set(session.sets.map(\.exerciseName)).count
            guard exercises > 0 else { return nil }
            return "\(exercises) ejercicios · \(session.sets.count) series"
        }
    }
}

struct StatusBadge: View {
    let status: SessionStatus

    var body: some View {
        Text(status.label)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }

    private var color: Color {
        switch status {
        case .planned: .secondary
        case .done: .green
        case .skipped: .red
        }
    }
}
