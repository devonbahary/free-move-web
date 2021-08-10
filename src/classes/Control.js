export class Control {
    constructor() {
        document.onkeydown = this.onkeydown;
        document.onkeyup = this.onkeyup;
        this.pressedKeys = {};
    }

    isPressed(key) {
        return this.pressedKeys[key];
    }

    onkeydown = (keyboardEvent) => {
        this.pressedKeys[keyboardEvent.key] = true;

        switch (keyboardEvent.key) {
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowLeft':
            case 'ArrowDown':
                keyboardEvent.preventDefault();
                break;
            default:
                break;
        }
    }

    onkeyup = (keyboardEvent) => {
        delete this.pressedKeys[keyboardEvent.key];
    }
}
