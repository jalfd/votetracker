import {findTarget, sleep} from "./common.js";

function setupVotePage() {
// sync from fragment

  document
    .querySelector<HTMLDivElement>(".flex-container")
    ?.addEventListener("pointerdown", async (evt) =>
      findTarget(evt, ".flex-container > div", async (target) => {
        target.style.backgroundColor = "blue";
        await sleep(400);
        target.style.backgroundColor = "";
      })
    );
}

document.addEventListener("load", setupVotePage);