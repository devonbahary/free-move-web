import { Element } from './Element';
import { Player } from "./Player";

export class World extends Element {
    constructor(bounds, playerStartPosition) {
        super();

        const { width, height } = bounds; 
        this.width = width;
        this.height = height;
        this.initElement();
        
        this.characters = [];
        this.obstacles = [];
        this.initObstacles();
        
        this.player = new Player(playerStartPosition);
        this.addCharacter(this.player);
    }

    get collisionEntities() {
        return [ ...this.characters, ...this.obstacles ];
    }
    
    addCharacter(character) {
        this.characters.push(character);
        character.setWorld(this);    
        this.element.appendChild(character.element);
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
            row.style.top = Element.convertSizeToPixels(i);
            this.element.appendChild(row);
        }
        
        for (let i = 1; i < this.width; i++) {
            const column = Element.createGridColumn();
            column.style.left = Element.convertSizeToPixels(i);
            this.element.appendChild(column);
        }
    }

    initObstacles() {
        const topBoundary = { x0: 0, y0: 0, x1: this.width, y1: 0 };
        const rightBoundary = { x0: this.width, y0: 0, x1: this.width, y1: this.height };
        const bottomBoundary = { x0: 0, y0: this.height, x1: this.width, y1: this.height };
        const leftBoundary = { x0: 0, y0: 0, x1: 0, y1: this.height };

        this.obstacles.push(
            topBoundary,
            rightBoundary,
            bottomBoundary,
            leftBoundary,
        );
    }    

    update() {
        for (const character of this.characters) {
            character.update();
        }
    }
}