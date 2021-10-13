import { Element } from "./Element";

export const SPRITE_TYPE = {
    CHARACTER: 'CHARACTER',
    PLAYER: 'PLAYER',
};

export class Sprite {
    constructor(type, gameEntity) {
        switch (type) {
            case SPRITE_TYPE.PLAYER:
                this.element = Element.create('span', 'character', 'player');
                Element.setDimensions(this.element, gameEntity.body.radius * 2, gameEntity.body.radius * 2);
                break;
            case SPRITE_TYPE.CHARACTER:
                this.element = Element.create('span', 'character');
                Element.setDimensions(this.element, gameEntity.body.radius * 2, gameEntity.body.radius * 2);
                break;
            default:
                throw new Error(`can't create Sprite with type ${type}`);
        }

        this.gameEntity = gameEntity;
    }

    update() {
        const { x0, y0 } = this.gameEntity.body;
        this.element.style.left = Element.convertSizeToPixels(x0);
        this.element.style.top = Element.convertSizeToPixels(y0);
    }
}
