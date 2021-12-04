import { RectBody } from '../../free-move/Bodies';
import { GameEntity } from './GameEntity';

export class RectEntity extends GameEntity {
    constructor() {
        super();
        this.body = new RectBody();
        this.body.name = `rect ${String.fromCharCode(RectEntity.#CHARACTER_CODE++)}`;
    }

    static #CHARACTER_CODE = 65; // <- 'A'
}
