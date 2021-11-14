import { Control } from './Control';
import { CircleEntity } from './game-entities/CircleEntity';
import { Element } from './graphics/Element';
import { GameLoopControlsSprite } from './graphics/sprites/GameLoopControlsSprite';
import { World } from '../free-move/World';
import { CircleSprite } from './graphics/sprites/CircleSprite';

const BEGIN_FRAME = 0;
const MAX_FRAME_STATES_TO_SAVE = 1000;
const STEP_FORWARD_FRAMES = 1;
const STEP_BACKWARD_FRAMES = 5;

export class Game {
    constructor(params) {
        this.params = params;

        this.sprites = [];
        this.gameEntities = [];

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
        this.player = new CircleEntity();
        this.player.body.name = 'player';
        const playerSprite = new CircleSprite(this.player.body);
        playerSprite.element.id = 'player';
        this.addGameEntity(this.player, playerSprite);

        const { x, y } = this.params.player.startPosition;
        this.player.moveTo({ x, y });
    }

    initGameLoop() {
        this.frameCount = BEGIN_FRAME;
        this.frameToWorldState = {};
        this.isPaused = false;
        
        setInterval(() => {
            this.update();
        }, 1000 / 60); // 60/s
    }

    addGameEntity(gameEntity, sprite) {
        this.gameEntities.push(gameEntity);
        this.addBody(gameEntity.body, sprite);        
    }

    addBody(body, sprite) {
        this.world.addBody(body);
        this.sprites.push(sprite);
        this.worldElement.appendChild(sprite.element);
    }

    update(ignorePause = false) {
        if (!this.isPaused || ignorePause) {
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
