import * as App from "@app/main"
import * as T from "@effect-ts/core/Effect"
import * as Exit from "@effect-ts/core/Effect/Exit"
import * as L from "@effect-ts/core/Effect/Layer"
import { pipe } from "@effect-ts/core/Function"

describe("App", () => {
  it("should succeed for numbers less then 0.5", async () => {
    const messages: string[] = []
    const res = await pipe(
      App.program,
      T.provideService(App.ConsoleService)({
        log: (message) =>
          T.effectTotal(() => {
            messages.push(message)
          })
      }),
      T.provideService(App.RandomService)({
        rand: T.effectTotal(() => {
          return 0.49
        })
      }),
      T.runPromiseExit
    )

    expect(res).toEqual(Exit.unit)
    expect(messages).toEqual(["got: 0.49"])
  })
  it("should raise for numbers greater then 0.5", async () => {
    const messages: string[] = []
    const TestConsole = L.fromEffect(App.ConsoleService)(
      T.succeed({
        log: (message) =>
          T.effectTotal(() => {
            messages.push(message)
          })
      })
    )
    const TestRandom = L.fromEffect(App.RandomService)(
      T.succeed({
        rand: T.effectTotal(() => {
          return 0.51
        })
      })
    )
    const res = await pipe(
      App.program,
      T.provideSomeLayer(TestConsole["+++"](TestRandom)),
      T.runPromiseExit
    )

    expect(Exit.untraced(res)).toEqual(Exit.fail(new App.BadRandomValue(0.51)))
    expect(messages).toEqual([])
  })
})
