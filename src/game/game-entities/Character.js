import { CircleBody } from '../../free-move/Bodies';
import { GameEntity } from './GameEntity';

export class Character extends GameEntity {
    constructor() {
        super();
        this.body = new CircleBody();
        this.body.name = `char ${String.fromCharCode(Character.#CHARACTER_CODE++)}`;
    }

    static #CHARACTER_CODE = 65; // <- 'A'
}