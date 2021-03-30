import * as App from "@app/main"
import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import * as S from "@effect-ts/core/Effect/Schedule"
import { pipe } from "@effect-ts/core/Function"

describe("App", () => {
  it("program should succeed for rand > 0.5", async () => {
    const messages: string[] = []

    await pipe(
      App.program,
      T.provideService(App.RandomService)({
        _tag: "RandomService",
        rand: T.succeed(0.51)
      }),
      T.provideService(App.ConsoleService)({
        _tag: "ConsoleService",
        log: (message) =>
          T.effectTotal(() => {
            messages.push(message)
          })
      }),
      App.provideLiveRetryScheduleService,
      T.runPromise
    )

    expect(messages).toEqual(["got: 0.51"])
  })
  it("program should fail for rand <= 0.5", async () => {
    const messages: string[] = []

    const result = await pipe(
      App.program,
      T.provideService(App.RandomService)({
        _tag: "RandomService",
        rand: T.succeed(0.49)
      }),
      T.provideService(App.ConsoleService)({
        _tag: "ConsoleService",
        log: (message) =>
          T.effectTotal(() => {
            messages.push(message)
          })
      }),
      T.provideService(App.RetryScheduleService)({
        _tag: "RetryScheduleService",
        schedule: S.recurs(0)
      }),
      T.runPromiseExit
    )

    expect(messages).toEqual([])
    expect(result).toEqual(Ex.fail(new App.InvalidRandom(0.49)))
  })
})
