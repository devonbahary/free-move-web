import { Element } from "../Element";

export class CharacterSprite {
    constructor(characterBody) {
        this.characterBody = characterBody;
        this.initElement();
    }

    getElement() {
        return Element.create('span', 'character');
    }
    
    initElement() {
        this.element = this.getElement();
        const { radius } = this.characterBody;
        Element.setDimensions(this.element, radius * 2, radius * 2);
        if (this.characterBody.name) this.element.innerHTML = this.characterBody.name;
    }

    update() {
        const { x0, y0 } = this.characterBody;
        Element.moveToGameCoordinates(this.element, x0, y0);
    }
}