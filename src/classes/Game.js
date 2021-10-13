import { Vectors } from '../utilities/Vectors';
import { Control } from './Control';
import { Character } from './entities/Character';
import { Sprite, SPRITE_TYPE } from './entities/Sprite';
import { World } from './entities/World';

export class Game {
    constructor(params) {
        this.params = params;

        this.sprites = [];
        this.characters = [];

        this.initWorld();
        this.initPlayPauseButton();
        this.initPlayer();
        this.initGameLoop();

        this.control = new Control();
    }

    initWorld() {
        this.world = new World(this.params.bounds);
        this.worldElement = Sprite.createWorld(this.world);
        document.body.appendChild(this.worldElement);
    }

    initPlayPauseButton() {
        this.playPauseButton = Sprite.createElement('button', undefined, 'play-pause-button'); 
        this.playPauseButton.innerHTML = '<ion-icon name="pause"></ion-icon>';
        this.playPauseButton.onclick = () => this.togglePlayPause();
        document.body.appendChild(this.playPauseButton);
    }

    initPlayer() {
        this.player = new Character();
        const playerSprite = new Sprite(SPRITE_TYPE.PLAYER, this.player);
        this.addCharacter(this.player, playerSprite);

        const { x, y } = this.params.player.startPosition;
        this.player.body.moveTo(x, y);
    }

    initGameLoop() {
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, 1000 / 60); // 60/s
    }

    addCharacter(character, characterSprite) {
        this.characters.push(character);
        this.world.addBody(character.body);

        this.sprites.push(characterSprite);
        this.worldElement.appendChild(characterSprite.element);
    }

    update() {
        this.updatePlayerInput();
        this.world.update();
        this.updateSprites();
    }

    togglePlayPause() {
        if (this.isPaused()) {
            this.resume();
            this.playPauseButton.innerHTML = '<ion-icon name="pause"></ion-icon>';
        } else {
            this.pause();
            this.playPauseButton.innerHTML = '<ion-icon name="play"></ion-icon>';
        }
    }

    pause() {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
    }

    resume() {
        if (!this.gameLoopInterval) {
            this.initGameLoop();
        }
    }

    isPaused() {
        return !Boolean(this.gameLoopInterval);
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
            this.player.move(movementVector);
        }
    }

    updateSprites() {
        for (const sprite of this.sprites) {
            sprite.update();
        }
    }
}
