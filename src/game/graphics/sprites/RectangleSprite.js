import { Element } from "../Element";

export class RectangleSprite {
    constructor(rectangleBody) {
        this.rectangleBody = rectangleBody;
        this.initElement();
    }

    getElement() {
        return Element.create('span', 'rectangle');
    }
    
    initElement() {
        this.element = this.getElement();
        const { width, height } = this.rectangleBody;
        Element.setDimensions(this.element, width, height);
    }

    update() {
        const { x0, y0 } = this.rectangleBody;
        Element.moveToGameCoordinates(this.element, x0, y0);
    }
}