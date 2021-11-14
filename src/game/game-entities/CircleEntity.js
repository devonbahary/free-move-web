import { CircleBody } from '../../free-move/Bodies';
import { GameEntity } from './GameEntity';

export class CircleEntity extends GameEntity {
    constructor() {
        super();
        this.body = new CircleBody();
        this.body.name = `circle ${String.fromCharCode(CircleEntity.#CHARACTER_CODE++)}`;
    }

    static #CHARACTER_CODE = 65; // <- 'A'
}