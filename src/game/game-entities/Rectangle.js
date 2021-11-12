import { RectangleBody } from "../../free-move/Bodies";
import { GameEntity } from "./GameEntity";

export class Rectangle extends GameEntity {
    constructor() {
        super();
        this.body = new RectangleBody(1, 1);
        this.body.name = `Rect${String.fromCharCode(Rectangle.#CHARACTER_CODE++)}`;
    }

    static #CHARACTER_CODE = 65; // <- 'A'
}