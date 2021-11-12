import { Element } from "../Element";


export class BodySprite {
    constructor(body) {
        this.body = body;
        this.initElement();
    }

    get elementClass() {
        throw new Error(`BodySprite is abstract`);
    }

    getElement() {
        return Element.create('span', this.elementClass);
    }
    
    initElement() {
        this.element = this.getElement();
        this.setDimensions();
        if (this.body.name) {
            const nameElement = Element.create('span', 'name');
            nameElement.innerHTML = this.body.name;
            this.element.appendChild(nameElement);
        }
    }

    setDimensions() {
        throw new Error(`BodySprite is abstract`);
    }

    update() {
        const { x0, y0 } = this.body;
        Element.moveToGameCoordinates(this.element, x0, y0);
    }
}