import { Vectors } from "../utilities/Vectors";

export class Control {
    constructor(world) {
        document.onkeydown = this.onkeydown;
        document.onkeyup = this.onkeyup;
        this.world = world;
        this.pressedKeys = {};
    }

    get player() {
        return this.world.player;
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

        const movementVector = Vectors.create(0, 0);

        if (this.pressedKeys['ArrowUp']) {
            movementVector.y = -1;
            if (this.pressedKeys['ArrowLeft']) {
                movementVector.x = -1;
            } else if (this.pressedKeys['ArrowRight']) {
                movementVector.x = 1;
            }
        } else if (this.pressedKeys['ArrowRight']) {
            movementVector.x = 1;
            if (this.pressedKeys['ArrowDown']) {
                movementVector.y = 1;
            }
        } else if (this.pressedKeys['ArrowDown']) {
            movementVector.y = 1;
            if (this.pressedKeys['ArrowLeft']) {
                movementVector.x = -1;
            }
        } else if (this.pressedKeys['ArrowLeft']) {
            movementVector.x = -1;
        }

        if (Vectors.magnitude(movementVector)) {
            const movement = 0.1;
            const normalizedVector = Vectors.normalize(movementVector);
            this.player.move(Vectors.mult(normalizedVector, movement));
        }
    }

    onkeyup = (keyboardEvent) => {
        console.log(keyboardEvent.key);
        delete this.pressedKeys[keyboardEvent.key];
    }
}