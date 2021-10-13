import { PIXELS_IN_SQUARE } from "../../constants";

export const SPRITE_TYPE = {
    CHARACTER: 'CHARACTER',
    PLAYER: 'PLAYER',
};

export class Sprite {
    constructor(type, gameEntity) {
        switch (type) {
            case SPRITE_TYPE.PLAYER:
                this.element = Sprite.createElement('span', 'character', 'player');
                Sprite.setElementDimensions(this.element, gameEntity.body.radius * 2, gameEntity.body.radius * 2);
                break;
            case SPRITE_TYPE.CHARACTER:
                this.element = Sprite.createElement('span', 'character');
                Sprite.setElementDimensions(this.element, gameEntity.body.radius * 2, gameEntity.body.radius * 2);
                break;
            default:
                throw new Error(`can't create Sprite with type ${type}`);
        }

        this.gameEntity = gameEntity;
    }

    static setElementDimensions(element, width, height) {
        Object.assign(element.style, {
            width: Sprite.convertSizeToPixels(width),
            height: Sprite.convertSizeToPixels(height),  
        });
    }

    update() {
        const { x0, y0 } = this.gameEntity.body;
        this.element.style.left = Sprite.convertSizeToPixels(x0);
        this.element.style.top = Sprite.convertSizeToPixels(y0);
    }

    static createElement(htmlElement, elementClass, elementId) {
        const element = document.createElement(htmlElement);
        if (elementClass) element.classList.add(elementClass);
        if (elementId) element.setAttribute('id', elementId);
        return element;
    }
    
    static createWorld(world) {
        const worldElement = Sprite.createElement('div', undefined, 'world');

        const { width, height } = world;
        
        Sprite.setElementDimensions(worldElement, width, height);

        for (let i = 1; i < height; i++) {
            const row = Sprite.createElement('div', 'row');
            row.style.top = Sprite.convertSizeToPixels(i);
            worldElement.appendChild(row);
        }
        
        for (let i = 1; i < width; i++) {
            const column = Sprite.createElement('div', 'column');
            column.style.left = Sprite.convertSizeToPixels(i);
            worldElement.appendChild(column);
        }

        return worldElement;
    }

    static convertSizeToPixels = (size) => `${size * PIXELS_IN_SQUARE}px`;
}