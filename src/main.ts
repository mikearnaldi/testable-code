import * as T from "@effect-ts/core/Effect"
import { tag } from "@effect-ts/core/Has"

export interface ConsoleService {
  log: (message: string) => T.Effect<unknown, never, void>
}

export const ConsoleService = tag<ConsoleService>()

export interface RandomService {
  rand: T.Effect<unknown, never, number>
}

export const RandomService = tag<RandomService>()

const log = (message: string) => T.accessServiceM(ConsoleService)((_) => _.log(message))

const rand = T.accessServiceM(RandomService)((_) => _.rand)

export function helloWorld(name: string) {
  return log(`hello world: ${name}`)
}

export class BadRandomValue {
  readonly _tag = "BadRandomValue"
  constructor(readonly n: number) {}
}

export const program = T.gen(function* (_) {
  const value = yield* _(rand)

  if (value > 0.5) {
    yield* _(T.fail(new BadRandomValue(value)))
  } else {
    yield* _(log(`got: ${value}`))
  }
})
