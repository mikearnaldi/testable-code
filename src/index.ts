import * as App from "@app/main"
import { pipe } from "@effect-ts/core/Function"
import * as R from "@effect-ts/node/Runtime"

pipe(
  App.program,
  App.provideLiveConsoleService,
  App.provideLiveRandomService,
  App.provideLiveRetryScheduleService,
  R.runMain
)
