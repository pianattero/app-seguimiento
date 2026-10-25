import { cycleFor, deficitFor, type CycleInfo } from './cycle'
import type { DayString } from './dates'
import { dayTarget, trainingKcal, type DayTarget } from './nutrition'
import type { Profile, Session } from './types'

export interface DayPlan {
  target: DayTarget
  cycle?: CycleInfo
  deficit: number
}

/** Objetivo de un día: entrenos de ese día + fase del ciclo. */
export function planForDay(day: DayString, profile: Profile, sessions: Session[], periodStarts: DayString[]): DayPlan {
  const cycle = cycleFor(day, profile, periodStarts)
  const deficit = deficitFor(profile, cycle)
  const daySessions = sessions.filter((s) => s.day === day)
  return {
    target: dayTarget(profile.person, trainingKcal(daySessions), deficit, profile.proteinPerKg),
    cycle,
    deficit,
  }
}
