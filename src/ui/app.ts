import { t } from "../i18n";
import { boomTemplate, flashTemplate } from "../celebrate/boom";
import { fxTemplate } from "../celebrate/confetti";
import { dialTemplate } from "./dial";
import { controlsTemplate, readoutTemplate } from "./readout";
import { sheetTemplate } from "./sheet";

// Renders directly into <body> (the flex container); inserted before the module <script>.
export function renderApp() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    "\n  " +
      [
        `<h1>${t.title}</h1>`,
        dialTemplate(),
        readoutTemplate(),
        controlsTemplate(),
        sheetTemplate(),
        [flashTemplate(), boomTemplate(), fxTemplate()].join("\n  "),
      ].join("\n\n  ") +
      "\n",
  );
}
