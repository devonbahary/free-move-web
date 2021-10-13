import { Vectors } from '../utilities/Vectors';
import { Control } from './Control';
import { Character } from './entities/Character';
import { Sprite, SPRITE_TYPE } from './entities/Sprite';
import { World } from './entities/World';

// TODO: make params passed in to constructor
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

// TODO: make character speed
const PLAYER_MOVEMENT_SPEED = 0.1;

export class Game {
    constructor() {
        this.sprites = [];
        this.characters = [];

        this.initWorld();
        this.initPlayer();

        this.control = new Control();
    }

    initWorld() {
        this.world = new World(gameParams.bounds);
        this.worldElement = Sprite.createWorld(this.world);
        document.body.appendChild(this.worldElement);
    }

    initPlayer() {
        this.player = new Character();
        const playerSprite = new Sprite(SPRITE_TYPE.PLAYER, this.player);
        this.addCharacter(this.player, playerSprite);

        const { x, y } = gameParams.player.startPosition;
        this.player.body.moveTo(x, y);
    }

    addCharacter(character, characterSprite) {
        this.characters.push(character);
        this.world.addBody(character.body);

        this.sprites.push(characterSprite);
        this.worldElement.appendChild(characterSprite.element);
    }

    update() {
        this.updatePlayerInput();
        this.updateGameEntities();
        this.world.update();
        this.updateSprites();
    }

    updatePlayerInput() {
        const movementVector = Vectors.create(0, 0);

        if (this.control.isPressed('ArrowUp')) {
            movementVector.y = -1;
            if (this.control.isPressed('ArrowLeft')) {
                movementVector.x = -1;
            } else if (this.control.isPressed('ArrowRight')) {
                movementVector.x = 1;
            }
        } else if (this.control.isPressed('ArrowRight')) {
            movementVector.x = 1;
            if (this.control.isPressed('ArrowDown')) {
                movementVector.y = 1;
            }
        } else if (this.control.isPressed('ArrowDown')) {
            movementVector.y = 1;
            if (this.control.isPressed('ArrowLeft')) {
                movementVector.x = -1;
            }
        } else if (this.control.isPressed('ArrowLeft')) {
            movementVector.x = -1;
        }

        if (Vectors.magnitude(movementVector)) {
            this.player.body.move(Vectors.rescale(movementVector, PLAYER_MOVEMENT_SPEED));
        }
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
