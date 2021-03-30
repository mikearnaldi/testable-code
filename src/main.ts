import * as T from "@effect-ts/core/Effect"
import * as S from "@effect-ts/core/Effect/Schedule"
import { pipe } from "@effect-ts/core/Function"
import type { Has } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"

export interface ConsoleService {
  _tag: "ConsoleService"
  log: (message: string) => T.Effect<unknown, never, void>
}

export const ConsoleService = tag<ConsoleService>()

function log(message: string): T.Effect<Has<ConsoleService>, never, void> {
  return T.accessServiceM(ConsoleService)((Console) => Console.log(message))
}

export interface RandomService {
  _tag: "RandomService"
  rand: T.Effect<unknown, never, number>
}

export const RandomService = tag<RandomService>()

export const rand = T.accessServiceM(RandomService)((Random) => Random.rand)

export class InvalidRandom {
  readonly _tag = "InvalidRandom"
  constructor(readonly n: number) {}

  toString() {
    return `Invalid random: ${this.n}`
  }
}

export const logOrFail = pipe(
  rand,
  T.chain((n) => (n > 0.5 ? log(`got: ${n}`) : T.fail(new InvalidRandom(n))))
)

export interface RetryScheduleService {
  _tag: "RetryScheduleService"
  schedule: S.Schedule<unknown, unknown, unknown>
}

export const RetryScheduleService = tag<RetryScheduleService>()

export const { schedule: accessScheduleM } = T.deriveAccessM(RetryScheduleService)([
  "schedule"
])

export const program = accessScheduleM((schedule) => pipe(logOrFail, T.retry(schedule)))

export const provideLiveConsoleService = T.provideService(ConsoleService)({
  _tag: "ConsoleService",
  log: (message) => T.effectTotal(() => console.log(message))
})

export const provideLiveRandomService = T.provideService(RandomService)({
  _tag: "RandomService",
  rand: T.effectTotal(() => Math.random())
})

export const provideLiveRetryScheduleService = T.provideService(RetryScheduleService)({
  _tag: "RetryScheduleService",
  schedule: S.recurs(9)
})
