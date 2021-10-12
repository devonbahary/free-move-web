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
            x: 7,
            y: 7,
        },
    },
};

class Game {
    constructor() {
        this.world = new World(gameParams.bounds);
        
        this.characters = [];
        this.player = new Player(gameParams.player.startPosition);
        this.addCharacter(this.player);
        
        this.control = new Control();
    }

    addCharacter(character) {
        this.characters.push(character);
        this.world.addBody(character.body);
        this.world.element.appendChild(character.element);
    }

    update() {
        this.player.update();
        for (const character of this.characters) {
            character.update();
        }
        this.world.update();
    }
}

export const game = new Game();
