import { RectBody } from "../../free-move/Bodies";
import { GameEntity } from "./GameEntity";

export class Rectangle extends GameEntity {
    constructor() {
        super();
        this.body = new RectBody(1, 1);
        this.body.name = `rect ${String.fromCharCode(Rectangle.#CHARACTER_CODE++)}`;
    }

    static #CHARACTER_CODE = 65; // <- 'A'
}