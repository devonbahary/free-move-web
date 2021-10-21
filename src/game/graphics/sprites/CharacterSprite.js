import { Element } from "../Element";

export class CharacterSprite {
    constructor(character) {
        this.character = character;
        this.initElement();
    }

    getElement() {
        return Element.create('span', 'character');
    }
    
    initElement() {
        this.element = this.getElement();
        const { radius } = this.character.body;
        Element.setDimensions(this.element, radius * 2, radius * 2);
    }

    update() {
        const { x0, y0 } = this.character.body;
        Element.moveToGameCoordinates(this.element, x0, y0);
    }
}