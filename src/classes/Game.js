import { Control } from './Control';
import { Player } from './entities/Player';
import { Sprite, SPRITE_TYPE } from './entities/Sprite';
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
        this.initWorld();
        
        this.sprites = [];
        this.characters = [];

        this.initPlayer();
        
        this.control = new Control();
    }

    initWorld() {
        this.world = new World(gameParams.bounds);

        this.worldElement = Sprite.createWorld(this.world);
        document.body.appendChild(this.worldElement);
    }

    initPlayer() {
        this.player = new Player(gameParams.player.startPosition);
        const playerSprite = new Sprite(SPRITE_TYPE.PLAYER, this.player);
        this.addCharacter(this.player, playerSprite);
    }

    addCharacter(character, characterSprite) {
        this.characters.push(character);
        this.world.addBody(character.body);

        this.sprites.push(characterSprite);
        this.worldElement.appendChild(characterSprite.element);
    }

    update() {
        this.updateGameEntities();
        this.world.update();
        this.updateSprites();
    }

    updateGameEntities() {
        this.player.update();
        for (const character of this.characters) {
            character.update();
        }
    }

    updateSprites() {
        for (const sprite of this.sprites) {
            sprite.update();
        }
    }
}

export const game = new Game();
