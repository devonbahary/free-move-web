import { Control } from './Control';
import { Character } from './entities/Character';
import { Element } from './entities/Element';
import { PlayerSprite } from './entities/sprites/PlayerSprite';
import { GameLoopControlsSprite } from './entities/sprites/GameLoopControlsSprite';
import { World } from './entities/World';

const BEGIN_FRAME = 0;
const MAX_FRAME_STATES_TO_SAVE = 1000;
const STEP_FORWARD_FRAMES = 1;
const STEP_BACKWARD_FRAMES = 5;

const toSaveableBodyState = (body) => {
    const { id, x, y, velocity } = body;
    return {
        id,
        x,
        y,
        velocity: { ...velocity }, 
    };
};

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
        this.frameCount = BEGIN_FRAME;
        this.frameToBodiesState = {};
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
            this.updateFrameState();
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

    updateFrameState() {
        const framesAgo = this.frameCount - MAX_FRAME_STATES_TO_SAVE;
        if (framesAgo >= BEGIN_FRAME) {
            delete this.frameToBodiesState[framesAgo];
        }

        this.frameToBodiesState[this.frameCount] = this.world.bodies.map(toSaveableBodyState);
    }

    stepBackward() {
        this.frameCount -= STEP_BACKWARD_FRAMES;
        const frameBodiesState = this.frameToBodiesState[this.frameCount];
        for (const bodyState of frameBodiesState) {
            const body = this.world.bodies.find(body => body.id === bodyState.id);
            body.moveTo(bodyState.x, bodyState.y);
            body.setVelocity(bodyState.velocity);
        }
    }

    stepForward() {
        for (let i = 0; i < STEP_FORWARD_FRAMES; i++) {
            this.update(true);
        }
    }
}
