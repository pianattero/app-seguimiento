import Foundation

/// Calendario con semanas de lunes a domingo.
enum WeekCalendar {
    static var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = Locale(identifier: "es_ES")
        calendar.firstWeekday = 2
        calendar.minimumDaysInFirstWeek = 4
        return calendar
    }

    static func startOfWeek(for date: Date) -> Date {
        calendar.dateInterval(of: .weekOfYear, for: date)?.start ?? calendar.startOfDay(for: date)
    }

    /// Los 7 días (inicio de día) de la semana que empieza en `weekStart`.
    static func days(ofWeekStarting weekStart: Date) -> [Date] {
        (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: weekStart) }
    }

    /// 0 = lunes ... 6 = domingo.
    static func weekdayIndex(of date: Date) -> Int {
        (calendar.component(.weekday, from: date) + 5) % 7
    }

    static func addingWeeks(_ weeks: Int, to date: Date) -> Date {
        calendar.date(byAdding: .weekOfYear, value: weeks, to: date) ?? date
    }
}

/// Semana fija: fuerza lunes y miércoles, running martes y jueves.
enum WeekTemplate {
    static let plan: [Int: SessionKind] = [
        0: .strength,
        1: .running,
        2: .strength,
        3: .running,
    ]

    static func plannedKind(forWeekdayIndex index: Int) -> SessionKind? {
        plan[index]
    }

    static let weekdayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
}
