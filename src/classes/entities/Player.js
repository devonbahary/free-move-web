import { Character } from './Character';

export class Player extends Character {
    constructor(startCoord) {
        super();
        this.setElementId('player');
        this.moveTo(startCoord.x, startCoord.y);
    }
}