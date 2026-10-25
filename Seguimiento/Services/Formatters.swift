import Foundation

enum Format {
    static func kilometers(_ meters: Double) -> String {
        String(format: "%.2f km", meters / 1000).replacingOccurrences(of: ".", with: ",")
    }

    static func duration(_ seconds: Double) -> String {
        let total = Int(seconds.rounded())
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        let secs = total % 60
        return hours > 0 ? String(format: "%d:%02d:%02d", hours, minutes, secs) : String(format: "%d:%02d", minutes, secs)
    }

    static func pace(_ secondsPerKm: Double) -> String {
        let total = Int(secondsPerKm.rounded())
        return String(format: "%d:%02d /km", total / 60, total % 60)
    }

    static func weight(_ kg: Double) -> String {
        let text = kg.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", kg) : String(format: "%.1f", kg)
        return text.replacingOccurrences(of: ".", with: ",") + " kg"
    }

    static func dayTitle(_ date: Date) -> String {
        date.formatted(.dateTime.weekday(.wide).day().month(.wide).locale(Locale(identifier: "es_ES"))).capitalized
    }

    static func weekTitle(_ weekStart: Date) -> String {
        let end = WeekCalendar.calendar.date(byAdding: .day, value: 6, to: weekStart) ?? weekStart
        let style = Date.FormatStyle.dateTime.day().month(.abbreviated).locale(Locale(identifier: "es_ES"))
        return "\(weekStart.formatted(style)) – \(end.formatted(style))"
    }
}
