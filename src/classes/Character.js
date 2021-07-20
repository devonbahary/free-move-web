import { Element } from './Element';

export class Character extends Element {
    constructor(radius = 0.5) {
        super();

        this.radius = radius;
        
        this.element = Element.createCharacter();
        this.setElementDimensions(this.radius * 2, this.radius * 2);
    }

    get x0() {
        return this.x;
    }

    get x1() {
        return this.x + this.radius * 2;
    }

    get y0() {
        return this.y;
    }

    get y1() {
        return this.y + this.radius * 2;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    update() {
        this.updateElementPosition(this.x, this.y);
    }

}