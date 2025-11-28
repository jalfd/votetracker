import z from "zod";

export const playerSchema = z.object({
  name: z.string(),
  votes: z.number().default(1),
  votedFor: z.string().optional(),
});
export const stateSchema = z.array(playerSchema);

export type Player = z.infer<typeof playerSchema>;
export type Players = z.infer<typeof stateSchema>;

export function serialize(state: Players) {
  return btoa(JSON.stringify(state))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
export function deserialize(str: string) {
  const json = atob(
    str.replaceAll(/\?|#/g, "").replaceAll("-", "+").replaceAll("_", "/")
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

export function createTile(player: Player) {
  const tile = document.createElement("div");
  const tileName = document.createElement("h2");
  const tileSub = document.createElement("h3");
  const voteRow = document.createElement("div");
  const voteLabel = document.createElement("span");
  const voteCount = document.createElement("span");
  tileName.textContent = player.name;
  tileSub.textContent = "🗡";
  tile.appendChild(tileName);
  tile.appendChild(tileSub);
  voteLabel.textContent = '🗳️ ';
  voteCount.classList.add("voteCount");
  voteCount.textContent = '0';
  voteRow.appendChild(voteLabel);
  voteRow.appendChild(voteCount);
  tile.appendChild(voteRow);

  if (player.votes === 2) {
    tile.classList.add("dagger");
  }
  if (player.votedFor !== undefined) {
    tile.classList.add("voted");
  }
  return tile;
}
