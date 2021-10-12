import { Character } from './Character';
import { Vectors } from '../../utilities/Vectors';
import { game } from '../Game';

const PLAYER_MOVEMENT_SPEED = 0.1;

export class Player extends Character {
    // TODO: get rid of startPosition here, let game reposition player
    constructor(startPosition) {
        super();
        this.body.moveTo(startPosition.x, startPosition.y);
    }

    update() {
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
            this.body.move(Vectors.rescale(movementVector, PLAYER_MOVEMENT_SPEED));
        }
    }
}
