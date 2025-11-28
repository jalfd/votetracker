import {
  createTile,
  deserialize,
  findTarget,
  serialize,
  sleep,
  type Player,
  type Players,
} from "./common.js";

// list of people who haven't voted

type Tile = HTMLDivElement;

let state: Players;

function nameFromTile(tile: Tile) {
  return tile.querySelector<HTMLHeadingElement>("h2")?.textContent ?? "";
}
function tileFromName(name: string | undefined) {
  for (const tile of tiles()) {
    if (nameFromTile(tile) === name) {
      return tile;
    }
  }
  return undefined;
}

function tiles() {
  return Array.from(document.querySelectorAll<Tile>(".flex-container > div"));
}

function countVotesFor(name: string) {
  return state
    .filter((player) => player.votedFor === name)
    .map((player) => player.votes)
    .reduce((acc, num) => acc + num);
}

function nextVoter(): Player | undefined {
  for (const item of state) {
    if (item.votedFor === undefined) {
      return item;
    }
  }
  return undefined;
}
function nextVoterTile(): Tile | undefined {
  return tileFromName(nextVoter()?.name);
}

function voteCountElement(tile: Tile | undefined) {
  return tile?.querySelector<HTMLSpanElement>(".voteCount");
}

function onStateChanged() {
  // update fragment
  document.location.hash = serialize(state);

  // first, nuke all tiles
  const container = document.querySelector<HTMLDivElement>(".flex-container");

  container?.replaceChildren();
  // then rebuild tiles
  for (const item of state) {
    container?.appendChild(createTile(item));
  }
  // then add nextvoter status
  nextVoterTile()?.classList.add("voter");

  const votesReceived: Record<string, number> = {};
  for (const player of state) {
    const count = countVotesFor(player.name);
    votesReceived[player.name] = count;
    const counter = voteCountElement(tileFromName(player.name));
    if (counter) {
      counter.textContent = count + "";
    }
  }
  // update info panels
  // list cast votes (with undo button)
  // list top voted
  // work out notifications (num remaining votes, is someone out, is someone about to be out)
}

export function setupVotePage() {
  // sync from fragment
  state = deserialize(document.location.hash);

  document
    .querySelector<HTMLDivElement>(".flex-container")
    ?.addEventListener("pointerdown", async (evt) =>
      findTarget(evt, ".flex-container > div", async (target) => {
        const voter = nextVoter();
        const name = nameFromTile(target as Tile);
        const recipient = state.find((item) => item.name === name);
        if (recipient && voter) {
          recipient.votes += voter.votes;
          voter.votedFor = recipient.name;
        }
        onStateChanged();
      })
    );

  onStateChanged();
}

setupVotePage();
