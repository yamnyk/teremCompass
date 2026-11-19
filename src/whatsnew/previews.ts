import { t } from "../i18n";

// Static look-alikes of controls, so a tour step never depends on live app state
// (the route button, for one, is hidden until the first lock).
export const previewMarkup = (key: string | undefined): string => {
  if (key === "eye") return `<span class="eyePreview">👁</span>`;
  if (key === "route") return `<span class="route">${t.buttons.route}</span>`;
  return "";
};
