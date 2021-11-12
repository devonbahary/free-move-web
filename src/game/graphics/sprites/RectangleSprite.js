import { Element } from "../Element";
import { BodySprite } from "./BodySprite";

export class RectangleSprite extends BodySprite {
    constructor(rectangleBody) {
        super(rectangleBody);
    }

    get elementClass() {
        return 'rectangle';
    }

    setDimensions() {
        const { width, height } = this.body;
        Element.setDimensions(this.element, width, height);
    }
}