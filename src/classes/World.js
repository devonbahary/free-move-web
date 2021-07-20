import { Element } from './Element';
import { Player } from "./Player";

export class World extends Element {
    constructor(width, height) {
        super();

        this.initElement(width, height);
        
        this.entities = [];
        
        this.player = new Player();
        this.addEntity(this.player);
    }

    initElement(width, height) {
        const element = document.createElement('div');
        this.element = element;
        this.setElementId('world');
        this.setElementDimensions(width, height);

        document.body.appendChild(this.element);
    }

    addEntity(entity) {
        this.entities.push(entity);
        this.element.appendChild(entity.element);
    }

    update() {
        for (const entity of this.entities) {
            entity.update();
        }
    }
}