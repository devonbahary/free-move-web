import { Element } from './Element';

export class Character extends Element {
    constructor(radius = 20) {
        super();

        this.radius = radius;
        
        const element = document.createElement('span');
        element.classList.add('character');
        this.element = element;
        
        this.setElementDimensions(this.radius * 2, this.radius * 2);
    }

    get x0() {
        return this.x - this.radius;
    }

    get x1() {
        return this.x + this.radius;
    }

    get y0() {
        return this.y - this.radius;
    }

    get y1() {
        return this.y + this.radius;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    update() {
        this.updateElementPosition(this.x, this.y);
    }

}