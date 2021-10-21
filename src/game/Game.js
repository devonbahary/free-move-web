import { Control } from './Control';
import { Character } from './Character';
import { Element } from './graphics/Element';
import { PlayerSprite } from './graphics/sprites/PlayerSprite';
import { GameLoopControlsSprite } from './graphics/sprites/GameLoopControlsSprite';
import { World } from '../free-move/World';

const BEGIN_FRAME = 0;
const MAX_FRAME_STATES_TO_SAVE = 1000;
const STEP_FORWARD_FRAMES = 1;
const STEP_BACKWARD_FRAMES = 5;

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
        this.player.body.name = 'player';
        this.player.body.mass = 5;
        const playerSprite = new PlayerSprite(this.player);
        this.addCharacter(this.player, playerSprite);

        const { x, y } = this.params.player.startPosition;
        this.player.body.moveTo(x, y);
    }

    initGameLoop() {
        this.frameCount = BEGIN_FRAME;
        this.frameToWorldState = {};
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

    update(force = false) {
        if (!this.isPaused || force) {
            this.frameCount += 1;
            this.control.update();
            this.world.update();
            this.updateFrameWorldState();
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

    updateFrameWorldState() {
        const framesAgo = this.frameCount - MAX_FRAME_STATES_TO_SAVE;
        if (framesAgo >= BEGIN_FRAME) {
            delete this.frameToWorldState[framesAgo];
        }

        this.frameToWorldState[this.frameCount] = this.world.getSaveableWorldState();
    }

    stepBackward() {
        this.frameCount -= STEP_BACKWARD_FRAMES;
        const frameWorldState = this.frameToWorldState[this.frameCount];
        this.world.loadWorldState(frameWorldState);
    }

    stepForward() {
        for (let i = 0; i < STEP_FORWARD_FRAMES; i++) {
            this.update(true);
        }
    }
}
