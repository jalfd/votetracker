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
  {
    const voters = state
      .filter((player) => player.votedFor !== undefined)
      .map((player) => ({ voter: player.name, votee: player.votedFor! }))
      .toSorted((lhs, rhs) => lhs.voter.localeCompare(rhs.voter));

    const voteStrings = state
      .filter((player) => player.votedFor !== undefined)
      .map((player) => `${player.name} stemte på ${player.votedFor}`)
      .toSorted();
    const voteTrackerContainer =
      document.querySelector<HTMLDivElement>("#vote-tracker");
    voteTrackerContainer?.replaceChildren();
    for (const voterInfo of voters) {
      const root = document.createElement("div");
      const voter = document.createElement("span");
      const remainder = document.createElement("span");
      const tip = document.createElement("span");
      voter.textContent = voterInfo.voter;
      voter.classList.add("voter");
      remainder.textContent = ` stemte på ${voterInfo.votee}`;
      tip.textContent = "Slet?";
      tip.classList.add("deleteVote");
      root.appendChild(voter);
      root.appendChild(remainder);
      root.appendChild(tip);
      voteTrackerContainer?.appendChild(root);
      // todo: set up delete click event
    }
  }
  // list top voted
  {
    const voteCountArray = Object.entries(votesReceived).map(
      ([name, count]) => ({ name, count })
    );
    const voteCountContainer =
      document.querySelector<HTMLDivElement>("#vote-ranking");
    voteCountContainer?.replaceChildren();
    for (const { name, count } of voteCountArray.toSorted()) {
      const item = document.createElement("div");
      item.textContent = `${name}: ${count} stemmer`;
      voteCountContainer?.appendChild(item);
    }
  }
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

  document
    .querySelector<HTMLDivElement>(".vote-tracker")
    ?.addEventListener("pointerdown", async (evt) =>
      findTarget(evt, ".vote-tracker > div", async (target) => {
        const voterName = target.querySelector(".voter")?.textContent;
        const voter = state.find((player) => player.name === voterName);
        if (voter) {
          voter.votedFor = undefined;
        }

        onStateChanged();
      })
    );

  onStateChanged();
}

setupVotePage();
