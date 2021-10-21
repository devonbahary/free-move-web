import { Vectors } from '../free-move/Vectors';
import { CircleBody } from '../free-move/Bodies';

let characterCode = 65; // 'A'

export class Character {
    constructor() {
        this.body = new CircleBody();
        this.movementSpeed = 0.1;
        this.body.name = `Character${String.fromCharCode(characterCode++)}`;
    }

    move(movementVector) {
        this.body.setVelocity(Vectors.rescale(movementVector, this.movementSpeed));
    }
}