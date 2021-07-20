import { Character } from './Character';

export class Player extends Character {
    constructor() {
        super(20);
        this.setElementId('player');
    }
}