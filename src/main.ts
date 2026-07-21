import './styles.css';
import { TurboCircuitGame } from './game/game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const uiRoot = document.querySelector<HTMLElement>('#ui-root');

if (!canvas || !uiRoot) {
  throw new Error('No se pudo iniciar Turbo Circuit 3D.');
}

new TurboCircuitGame(canvas, uiRoot);
