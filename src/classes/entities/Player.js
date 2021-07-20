import { Character } from './Character';

export class Player extends Character {
    constructor(startPosition) {
        super();
        this.setElementId('player');
        this.moveTo(startPosition.x, startPosition.y);
    }
}