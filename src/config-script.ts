import { findTarget, serialize, type State } from "./common.js";
import z from "zod";

function parseTile(tile: HTMLDivElement) {
  const nameElement = tile.querySelector<HTMLHeadingElement>("h2")!;
  const name = tile.querySelector<HTMLHeadingElement>("h2")?.textContent ?? "";
  const dagger = tile.classList.contains("dagger");

  return { name, nameElement, dagger };
}
function serializeFromDom() {
  const state: State = {};
  const tiles = document.querySelectorAll<HTMLDivElement>(
    "#tiles-container > div"
  );
  // for each, we need to extract the name and the state of the dagger class
  for (const tile of Array.from(tiles)) {
    const { name, dagger } = parseTile(tile);
    console.log(`Found tile for ${name} with ${dagger ? 2 : 1} votes`);
    state[name] = { votes: dagger ? 2 : 1 };
  }

  return serialize(state);
}

function onSubmit() {
  // dump to storage
  const textArea = document.getElementById(
    "names-input"
  ) as HTMLTextAreaElement;

  const daggers: string[] = [];
  const tiles = document.querySelectorAll<HTMLDivElement>(
    "#tiles-container > div"
  );
  // for each, we need to extract the name and the state of the dagger class
  for (const tile of Array.from(tiles)) {
    const { name, dagger } = parseTile(tile);
    if (dagger) {
      daggers.push(name);
    }
  }
  localStorage.setItem("text", textArea.value);
  localStorage.setItem("daggers", JSON.stringify(daggers));
  window.location.href = `votes.html#${serializeFromDom()}`;
}

function loadFromLocalStorage() {
  const text = localStorage.getItem("text") ?? "";
  const daggers = z
    .array(z.string())
    .parse(JSON.parse(localStorage.getItem("daggers") ?? "[]"));
  const textArea = document.getElementById(
    "names-input"
  ) as HTMLTextAreaElement;
  textArea.value = text;
  return daggers;
}

function setupConfigPage() {
  const daggers = loadFromLocalStorage();
  const elem = document.getElementById("names-input") as HTMLTextAreaElement;

  const refreshTiles = () => {
    const names = new Set(
      elem.value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length !== 0)
    );
    const tilesContainer = document.getElementById(
      "tiles-container"
    ) as HTMLDivElement;
    tilesContainer.replaceChildren();
    for (const name of names) {
      const tile = document.createElement("div");
      const tileName = document.createElement("h2");
      const tileSub = document.createElement("h3");
      tileName.textContent = name;
      tileSub.textContent = "🗡";
      tile.appendChild(tileName);
      tile.appendChild(tileSub);
      tilesContainer.appendChild(tile);
    }
  };

  elem.addEventListener("input", refreshTiles);
  refreshTiles();

  const tiles = document.querySelectorAll<HTMLDivElement>(
    "#tiles-container > div"
  );
  for (const tile of Array.from(tiles)) {
    const { nameElement } = parseTile(tile);
    if (daggers.includes(nameElement.textContent)) {
      tile.classList.add("dagger");
    }
  }

  document
    .querySelector<HTMLDivElement>("#tiles-container")
    ?.addEventListener("pointerdown", async (evt) =>
      findTarget(evt, "#tiles-container > div", async (target) => {
        if (target.classList.contains("dagger")) {
          target.classList.remove("dagger");
        } else {
          target.classList.add("dagger");
        }
      })
    );

  document
    .querySelector<HTMLDivElement>("#tiles-container")
    ?.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });
}

document.addEventListener("load", setupConfigPage);
