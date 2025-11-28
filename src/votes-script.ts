import {
  createTile,
  deserialize,
  findTarget,
  serialize,
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
  return Array.from(document.querySelectorAll<Tile>("#tiles-container > div"));
}

function countVotesFor(name: string) {
  return state
    .filter((player) => player.votedFor === name)
    .map((player) => player.votes)
    .reduce((acc, num) => acc + num, 0);
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
  // update url
  history.replaceState(
    state,
    "",
    new URL(`?${serialize(state)}`, document.location.href)
  );

  // first, nuke all tiles
  const container = document.querySelector<HTMLDivElement>("#tiles-container");

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
    console.log(`player ${player.name} received ${count} votes`);
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
      .map((player) => ({ voter: player.name, votee: player.votedFor! }));

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
      tip.textContent = "❌";
      tip.classList.add("deleteVote");
      root.appendChild(voter);
      root.appendChild(remainder);
      root.appendChild(tip);
      voteTrackerContainer?.appendChild(root);
    }
  }
  // list top voted
  const voteCountArray = Object.entries(votesReceived)
    .map(([name, count]) => ({ name, count }))
    .toSorted((lhs, rhs) => rhs.count - lhs.count);
  const voteCountContainer =
    document.querySelector<HTMLDivElement>("#vote-ranking");
  voteCountContainer?.replaceChildren();
  for (const { name, count } of voteCountArray) {
    if (count !== 0) {
    const item = document.createElement("div");
    item.textContent = `${name}: ${count} stemmer`;
    voteCountContainer?.appendChild(item);
    }
  }

  const remainingVotes = state
    .filter((player) => player.votedFor === undefined)
    .map((player) => player.votes)
    .reduce((acc, val) => acc + val, 0);
  const mostVotes = voteCountArray[0];
  const nextVoteCount = nextVoter()?.votes ?? 0;

  const noticesContainer = document.querySelector<HTMLDivElement>("#notices")!;
  noticesContainer.replaceChildren();

  if (remainingVotes === nextVoteCount) {
    if (remainingVotes === 0) {
      const votingComplete = document.createElement("div");
      votingComplete.textContent = "Alle har stemt!";
      noticesContainer.appendChild(votingComplete);
    } else {
      // final vote
      const finalVote = document.createElement("div");
      finalVote.textContent = "Sidste stemme!";
      noticesContainer.appendChild(finalVote);
    }
  } else {
    const remainingVotesNotice = document.createElement("div");
    remainingVotesNotice.textContent = `${remainingVotes} stemmer tilbage`;
    noticesContainer.appendChild(remainingVotesNotice);
  }

  if (mostVotes !== undefined) {
    if (voteCountArray[1] !== undefined) {
      // if no one can catch up to mostVotes
      if (voteCountArray[1].count + remainingVotes < mostVotes.count) {
        // Someone is banished
        const isBanishedNotice = document.createElement("div");
        isBanishedNotice.textContent = `${mostVotes.name} er forvist`;
        noticesContainer.appendChild(isBanishedNotice);
      } else {
        const voteForWillBanish: string[] = [];
        const canProtectFromBanishment: Record<string, string[]> = {};

        for (let i = 0; i < voteCountArray.length; ++i) {
          const current = voteCountArray[i]!;
          const reference = i === 0 ? voteCountArray[1]! : voteCountArray[0]!;

          if (current.count > reference.count) {
            // if I have more votes than anyone else we need to check who can *keep* me from banishment
            // so I have a number of votes. Find people who can catch me now, but can't if nextVoteCount is wasted
            const arrayWithoutMe = voteCountArray.toSpliced(i, 1);
            const canSaveMe = arrayWithoutMe.filter(
              (item) =>
                item.count + remainingVotes - nextVoteCount >= current.count
            );
            if (canSaveMe.length !== 0) {
              canProtectFromBanishment[current.name] = canSaveMe.map(
                (item) => item.name
              );
            }
          } else if (
            current.count + nextVoteCount >
            reference.count + remainingVotes - nextVoteCount
          ) {
            // if I am tied or behind someone else, the question is whether I'll be banished if I get this vote
            voteForWillBanish.push(current.name);
          }
        }

        for (const item of voteForWillBanish) {
          const notice = document.createElement("div");
          notice.textContent = `Hvis ${
            nextVoter()?.name
          } stemmer på ${item} er han/hun forvist`;
          noticesContainer.appendChild(notice);
        }
        for (const [banishee, unless] of Object.entries(
          canProtectFromBanishment
        )) {
          const notice = document.createElement("div");
          const prettyUnless =
            unless.length === 1
              ? unless[0]
              : unless.slice(0, -1).join(", ") +
                " eller " +
                unless[unless.length - 1];
          notice.textContent = `Hvis ${
            nextVoter()?.name
          } ikke stemmer på ${prettyUnless} er ${banishee} forvist`;
          noticesContainer.appendChild(notice);
        }
      }
    }
  }

  const tilesHeader =
    document.querySelector<HTMLHeadingElement>("#tiles-header");
  if (tilesHeader !== null) {
    const next = nextVoter()?.name;
    if (next === undefined) {
      tilesHeader.textContent = "Alle har stemt";
    } else {
      tilesHeader.textContent = `Næste stemme: ${next}`;
    }
  }
}

export function setupVotePage() {
  // sync from url
  state = deserialize(document.location.search);

  document
    .querySelector<HTMLDivElement>("#tiles-container")
    ?.addEventListener("pointerdown", async (evt) =>
      findTarget(evt, "#tiles-container > div", async (target) => {
        const voter = nextVoter();
        const name = nameFromTile(target as Tile);
        const recipient = state.find((item) => item.name === name);
        if (recipient && voter) {
          voter.votedFor = recipient.name;
          console.log(
            `player ${voter.name} cast ${voter.votes} votes for ${voter.votedFor}`
          );
        }
        onStateChanged();
      })
    );

  document
    .querySelector<HTMLDivElement>("#vote-tracker")
    ?.addEventListener("pointerdown", async (evt) =>
      findTarget(evt, "#vote-tracker > div", async (target) => {
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
