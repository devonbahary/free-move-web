import { Vectors } from '../free-move/Vectors';

export class Control {
    constructor(player) {
        this.player = player;

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
    };

    onkeyup = (keyboardEvent) => {
        delete this.pressedKeys[keyboardEvent.key];
    };

    update() {
        this.updatePlayerInput();
    }

    updatePlayerInput() {
        const movementVector = Vectors.create();

        if (this.isPressed('ArrowUp')) {
            movementVector.y = -1;
            if (this.isPressed('ArrowLeft')) {
                movementVector.x = -1;
            } else if (this.isPressed('ArrowRight')) {
                movementVector.x = 1;
            }
        } else if (this.isPressed('ArrowRight')) {
            movementVector.x = 1;
            if (this.isPressed('ArrowDown')) {
                movementVector.y = 1;
            }
        } else if (this.isPressed('ArrowDown')) {
            movementVector.y = 1;
            if (this.isPressed('ArrowLeft')) {
                movementVector.x = -1;
            }
        } else if (this.isPressed('ArrowLeft')) {
            movementVector.x = -1;
        }

        if (Vectors.magnitude(movementVector)) {
            this.player.move(movementVector);
        }
    }
}
