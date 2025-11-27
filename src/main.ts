import { setupConfigPage } from "./config-script";
import { setupVotePage } from "./votes-script";

export function setupConfigPageLoad() {
  document.addEventListener("load", setupConfigPage);
}

export function setupVotePageLoad() {
  document.addEventListener("load", setupVotePage);
}
