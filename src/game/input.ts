import type { DriverInput } from './types';

interface InputOptions {
  onPause: () => void;
}

export class InputController {
  private left = false;
  private right = false;
  private accelerate = false;
  private brake = false;
  private drift = false;
  private itemQueued = false;
  private readonly autoAccelerate = window.matchMedia('(pointer: coarse)').matches;

  constructor(options: InputOptions) {
    this.bindKeyboard(options.onPause);
    this.bindHoldButton('steer-left', (active) => { this.left = active; });
    this.bindHoldButton('steer-right', (active) => { this.right = active; });
    this.bindHoldButton('drift-button', (active) => { this.drift = active; });

    const itemButton = document.querySelector<HTMLButtonElement>('#item-button');
    itemButton?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.itemQueued = true;
      itemButton.classList.add('active');
    });
    const releaseItem = () => itemButton?.classList.remove('active');
    itemButton?.addEventListener('pointerup', releaseItem);
    itemButton?.addEventListener('pointercancel', releaseItem);

    document.querySelector<HTMLButtonElement>('#pause-button')?.addEventListener('click', options.onPause);
  }

  sample(): DriverInput {
    const steer = this.left === this.right ? 0 : this.left ? -1 : 1;
    const result: DriverInput = {
      steer,
      throttle: this.autoAccelerate ? 1 : this.accelerate ? 1 : 0,
      brake: this.brake ? 1 : 0,
      drift: this.drift,
      useItem: this.itemQueued,
    };
    this.itemQueued = false;
    return result;
  }

  reset(): void {
    this.left = false;
    this.right = false;
    this.accelerate = false;
    this.brake = false;
    this.drift = false;
    this.itemQueued = false;
    document.querySelectorAll('.touch-button.active').forEach((button) => button.classList.remove('active'));
  }

  private bindKeyboard(onPause: () => void): void {
    const setKey = (key: string, active: boolean): boolean => {
      switch (key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.left = active;
          return true;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.right = active;
          return true;
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.accelerate = active;
          return true;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.brake = active;
          return true;
        case 'Shift':
          this.drift = active;
          return true;
        case ' ':
          if (active) this.itemQueued = true;
          return true;
        default:
          return false;
      }
    };

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
        if (!event.repeat) onPause();
        event.preventDefault();
        return;
      }
      if (setKey(event.key, true)) event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
      if (setKey(event.key, false)) event.preventDefault();
    });

    window.addEventListener('blur', () => this.reset());
  }

  private bindHoldButton(id: string, setter: (active: boolean) => void): void {
    const button = document.querySelector<HTMLButtonElement>(`#${id}`);
    if (!button) return;

    const down = (event: PointerEvent) => {
      event.preventDefault();
      setter(true);
      button.classList.add('active');
      try { button.setPointerCapture(event.pointerId); } catch { /* no-op */ }
    };
    const up = (event: PointerEvent) => {
      event.preventDefault();
      setter(false);
      button.classList.remove('active');
    };

    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  }
}
