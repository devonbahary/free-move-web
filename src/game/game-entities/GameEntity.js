import { Vectors } from '../../free-move/vectors/Vectors';

export class GameEntity {
    constructor() {
        this.movementSpeed = 0.05;
    }

    move(movementVector) {
        this.body.setVelocity(Vectors.rescale(movementVector, this.movementSpeed));
    }

    moveTo(positionVector) {
        this.body.moveTo(positionVector);
    }
}
