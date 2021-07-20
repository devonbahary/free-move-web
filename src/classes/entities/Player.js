import { Character } from './Character';

export class Player extends Character {
    constructor() {
        super();
        this.setElementId('player');
        this.moveTo(6, 4);
    }
}