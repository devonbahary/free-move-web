import { Control } from './Control';
import { Player } from './entities/Player';
import { World } from './entities/World';

export const gameParams = {
    bounds: {
        width: 15,
        height: 15,
    },
    player: {
        startPosition: {
            x: 12,
            y: 7,
        },
    },
};

class Game {
    constructor() {
        this.world = new World(gameParams.bounds);
        
        this.player = new Player(gameParams.player.startPosition);
        this.world.addCharacter(this.player);
        
        this.control = new Control();
    }

    update() {
        this.world.update();
    }
}

export const game = new Game();
