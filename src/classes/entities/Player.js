import { Character } from './Character';
import { Vectors } from '../../utilities/Vectors';
import { game } from '../Game';

export class Player extends Character {
    constructor(startPosition) {
        super();
        this.setElementId('player');
        this.moveTo(startPosition.x, startPosition.y);
    }

    update() {
        super.update();
        this.updateUserInput();
    }

    updateUserInput() {
        const movementVector = Vectors.create(0, 0);

        if (game.control.isPressed('ArrowUp')) {
            movementVector.y = -1;
            if (game.control.isPressed('ArrowLeft')) {
                movementVector.x = -1;
            } else if (game.control.isPressed('ArrowRight')) {
                movementVector.x = 1;
            }
        } else if (game.control.isPressed('ArrowRight')) {
            movementVector.x = 1;
            if (game.control.isPressed('ArrowDown')) {
                movementVector.y = 1;
            }
        } else if (game.control.isPressed('ArrowDown')) {
            movementVector.y = 1;
            if (game.control.isPressed('ArrowLeft')) {
                movementVector.x = -1;
            }
        } else if (game.control.isPressed('ArrowLeft')) {
            movementVector.x = -1;
        }

        if (Vectors.magnitude(movementVector)) {
            const movement = 0.1;
            this.move(Vectors.rescale(movementVector, movement));
        }
    }
}
