import { pipe } from "@effect-ts/core/Function"

export type Either<E, A> = { _tag: "Left"; e: E } | { _tag: "Right"; a: A }

export function left<E>(e: E): Either<E, never> {
  return {
    _tag: "Left",
    e
  }
}

export function right<A>(a: A): Either<never, A> {
  return {
    _tag: "Right",
    a
  }
}

export type Effect<R, E, A> = (r: R) => () => Either<E, A>

export function succeed<A>(a: A): Effect<unknown, never, A> {
  return () => () => right(a)
}

export function fail<E>(e: E): Effect<unknown, E, never> {
  return () => () => left(e)
}

export function effect<A>(a: () => A): Effect<unknown, never, A> {
  return () => () => right(a())
}

export function effectPartial<E, A>(
  a: () => A,
  e: (_: unknown) => E
): Effect<unknown, E, A> {
  return () => () => {
    try {
      return right(a())
    } catch (u) {
      return left(e(u))
    }
  }
}

export function accessM<R2, R, E, A>(
  f: (_: R2) => Effect<R, E, A>
): Effect<R & R2, E, A> {
  return (r) => f(r)(r)
}

export function runMain<R>(r: R) {
  return <E>(self: Effect<R, E, void>) => {
    const result = self(r)()

    if (result._tag === "Left") {
      console.error(result.e)
    }
  }
}

export function run<R>(r: R): <E, A>(self: Effect<R, E, A>) => Either<E, A> {
  return (self) => self(r)()
}

export function retry(n: number) {
  return <R, E, A>(self: Effect<R, E, A>): Effect<R, E, A> => (r) => () => {
    let result: Either<E, A>
    for (let i = 0; i < Math.min(1, Math.ceil(n)); i++) {
      result = self(r)()

      if (result._tag === "Right") {
        return result
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result!
  }
}

export function chain<A, R1, E1, A1>(f: (a: A) => Effect<R1, E1, A1>) {
  return <R, E>(self: Effect<R, E, A>): Effect<R & R1, E | E1, A1> => (r) => () => {
    const resA = self(r)()
    if (resA._tag === "Right") {
      return f(resA.a)(r)()
    }
    return resA
  }
}

export interface ConsoleService {
  Console: {
    log: (message: string) => Effect<unknown, never, void>
  }
}

export function log(message: string): Effect<ConsoleService, never, void> {
  return accessM(({ Console }: ConsoleService) => Console.log(message))
}

export interface RandomService {
  Random: {
    rand: Effect<unknown, never, number>
  }
}

export const rand = accessM(({ Random }: RandomService) => Random.rand)

export class InvalidRandom {
  readonly _tag = "InvalidRandom"
  constructor(readonly n: number) {}
}

export const program = pipe(
  rand,
  chain((n) => (n > 0.5 ? log(`got: ${n}`) : fail(new InvalidRandom(n))))
)

export const main = retry(10)(program)

pipe(
  main,
  runMain({
    Console: { log: (message) => effect(() => console.log(message)) },
    Random: { rand: effect(() => Math.random()) }
  })
)
