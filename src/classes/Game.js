import { Control } from './Control';
import { Character } from './entities/Character';
import { Element } from './entities/Element';
import { PlayerSprite } from './entities/sprites/PlayerSprite';
import { GameLoopControlsSprite } from './entities/sprites/GameLoopControlsSprite';
import { World } from './entities/World';

export class Game {
    constructor(params) {
        this.params = params;

        this.sprites = [];
        this.characters = [];

        this.initWorld();
        this.initGameLoopControls();
        this.initPlayer();
        
        this.initGameLoop();

        this.control = new Control(this.player);
    }

    initWorld() {
        this.world = new World(this.params.bounds);
        this.worldElement = Element.createWorld(this.world);
        document.body.appendChild(this.worldElement);
    }

    initGameLoopControls() {
        this.gameLoopControls = new GameLoopControlsSprite(this);
        document.body.appendChild(this.gameLoopControls.element);
        this.sprites.push(this.gameLoopControls);
    }

    initPlayer() {
        this.player = new Character();
        const playerSprite = new PlayerSprite(this.player);
        this.addCharacter(this.player, playerSprite);

        const { x, y } = this.params.player.startPosition;
        this.player.body.moveTo(x, y);
    }

    initGameLoop() {
        this.isPaused = false;
        
        setInterval(() => {
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
        if (!this.isPaused) {
            this.control.update();
            this.world.update();
        }
        this.updateSprites();
    }

    togglePlayPause() {
        this.isPaused = !this.isPaused;
    }

    updateSprites() {
        for (const sprite of this.sprites) {
            sprite.update();
        }
    }
}
