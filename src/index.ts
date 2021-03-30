import * as T from "@effect-ts/core/Effect"
import * as S from "@effect-ts/core/Effect/Schedule"
import { pipe } from "@effect-ts/core/Function"
import { runMain } from "@effect-ts/node/Runtime"

import { ConsoleService, program, RandomService } from "./main"

pipe(
  program,
  T.retry(S.exponential(10)["&&"](S.recurs(10))),
  T.provideService(ConsoleService)({
    log: (message) =>
      T.effectTotal(() => {
        console.log(message)
      })
  }),
  T.provideService(RandomService)({
    rand: T.effectTotal(() => {
      return Math.random()
    })
  }),
  runMain
)
