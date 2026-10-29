import { $ } from './lib/dom';

import { initDemo } from './demo';
import { initInstall } from './install';
import { startLoop } from './loop';

import { initFx } from './celebrate/confetti';
import { start } from './sensors/location';
import { registerSW } from './sw-register';

import { renderApp } from './ui/app';
import { buildTicks } from './ui/dial';
import { initSheet } from './ui/sheet';

import './styles/tokens.css';
import './styles/base.css';
import './styles/dial.css';
import './styles/readout.css';
import './styles/controls.css';
import './styles/locked.css';
import './styles/celebrate.css';
import './styles/sheet.css';
import './styles/motion.css';

renderApp();
buildTicks();
initFx();
startLoop();
$('go').addEventListener('click', start);
initSheet();
initInstall();
initDemo();
registerSW();
