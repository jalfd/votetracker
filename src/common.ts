import z from "zod";

const stateSchema = z.record(
  z.string(),
  z.object({
    votes: z.number().default(1),
    votedFor: z.string().optional(),
  })
);

export type State = z.infer<typeof stateSchema>;

export function serialize(state: State) {
  return btoa(JSON.stringify(state))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
export function deserialize(str: string) {
  const json = atob(
    str.replaceAll("#", "").replaceAll("-", "+").replaceAll("_", "/")
  );

  return stateSchema.parse(JSON.parse(json));
}

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function findTarget<T extends Event>(
  evt: T,
  targetMatcher: string,
  handler: (target: HTMLElement) => void
) {
  const target = (evt.target as HTMLElement)?.closest(targetMatcher);
  if (!target || !(target instanceof HTMLElement)) {
    return;
  }
  handler(target);
}


