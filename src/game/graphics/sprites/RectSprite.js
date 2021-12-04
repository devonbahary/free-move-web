import { Element } from '../Element';
import { BodySprite } from './BodySprite';

export class RectSprite extends BodySprite {
    constructor(rectBody) {
        super(rectBody);
    }

    get elementClass() {
        return 'rectangle';
    }

    setDimensions() {
        const { width, height } = this.body;
        Element.setDimensions(this.element, width, height);
    }
}
