import { createTile, findTarget, playerSchema, serialize, type Players } from "./common.js";
import z from "zod";

function parseTile(tile: HTMLDivElement) {
  const nameElement = tile.querySelector<HTMLHeadingElement>("h2")!;
  const name = tile.querySelector<HTMLHeadingElement>("h2")?.textContent ?? "";
  const dagger = tile.classList.contains("dagger");

  return { name, nameElement, dagger };
}
function serializeFromDom() {
  const state: Players = [];
  const tiles = document.querySelectorAll<HTMLDivElement>(
    "#tiles-container > div"
  );
  // for each, we need to extract the name and the state of the dagger class
  for (const tile of Array.from(tiles)) {
    const { name, dagger } = parseTile(tile);
    console.log(`Found tile for ${name} with ${dagger ? 2 : 1} votes`);
    state.push({ name, votes: dagger ? 2 : 1 });
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
  window.location.href = `votes.html?${serializeFromDom()}`;
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

export function setupConfigPage() {
  const daggers = loadFromLocalStorage();
  const elem = document.getElementById("names-input") as HTMLTextAreaElement;

  const refreshTiles = () => {
    let names = elem.value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length !== 0);

      let start = names.findIndex(name => name.includes('*'));
      if (start == -1) {start = 0;}
      const moveToEnd = names.slice(0, start);
      names = names.slice(start).concat(moveToEnd);
      names = names.map(name => name.replaceAll('*', ''));

    const duplicateCheck = new Set(names);
    for (const name of duplicateCheck) {
      while (names.indexOf(name) !== names.lastIndexOf(name)) {
        names.splice(names.lastIndexOf(name), 1);
      }
    }

    const tilesContainer = document.querySelector<HTMLDivElement>(
      "#tiles-container"
    )!;
    tilesContainer.replaceChildren();
    for (const name of names) {
      tilesContainer.appendChild(createTile(playerSchema.parse({name})));
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

  const submit = document.querySelector<HTMLDivElement>("#submit");
  submit?.addEventListener("pointerdown", onSubmit);
}

setupConfigPage();
