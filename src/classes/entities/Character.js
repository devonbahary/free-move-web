import { CircleBody } from './Bodies';
import { Element } from './Element';

export class Character extends Element {
    constructor() {
        super();

        this.body = new CircleBody();
        
        this.element = Element.createCharacter();
        this.setElementDimensions(this.body.radius * 2, this.body.radius * 2);
    }

    setWorld(world) {
        this.world = world;
    }

    update() {
        super.update();
    }    
}