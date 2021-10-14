import { Vectors } from '../../utilities/Vectors';
import { CircleBody } from './Bodies';

export class Character {
    constructor() {
        this.body = new CircleBody();
        this.movementSpeed = 0.1;
    }

    move(movementVector) {
        this.body.setVelocity(Vectors.rescale(movementVector, this.movementSpeed));
    }
}