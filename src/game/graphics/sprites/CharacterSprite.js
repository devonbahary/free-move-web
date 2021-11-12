import { Element } from "../Element";
import { BodySprite } from "./BodySprite";

export class CharacterSprite extends BodySprite {
    constructor(characterBody) {
        super(characterBody);
    }

    get elementClass() {
        return 'character';
    }

    setDimensions() {
        const { radius } = this.body;
        Element.setDimensions(this.element, radius * 2, radius * 2);
    }
}