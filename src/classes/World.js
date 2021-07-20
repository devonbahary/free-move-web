import { convertSizeToPixels } from '../utilities';
import { Element } from './Element';
import { Player } from "./Player";

export class World extends Element {
    constructor(width, height) {
        super();

        this.width = width;
        this.height = height;
        this.initElement();
        
        this.entities = [];
        
        this.player = new Player();
        this.addEntity(this.player);
    }

    initElement() {
        this.element = Element.createElement('div');
        this.setElementId('world');
        this.setElementDimensions(this.width, this.height);

        document.body.appendChild(this.element);

        this.initGridElements();
    }

    initGridElements() {
        for (let i = 1; i < this.height; i++) {
            const row = Element.createGridRow();
            row.style.top = convertSizeToPixels(i);
            this.element.appendChild(row);
        }
        
        for (let i = 1; i < this.width; i++) {
            const column = Element.createGridColumn();
            column.style.left = convertSizeToPixels(i);
            this.element.appendChild(column);
        }
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