import { Character } from './classes/entities/Character';
import { Game } from './classes/Game';
import { Vectors } from './utilities/Vectors';
import { Sprite, SPRITE_TYPE } from './classes/entities/Sprite';
import './main.css';

/*
    to-do list:
        - inelastic collisions with another circle / rectangle
            - implement "sliding" or "glancing" 
        - investigate weird "jumping" / teleporting behavior when moving immobile elastic entities
        - investigate why player mass of 500 would make collisions "stick" to it
*/

const GAME_PARAMS = {
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

const GAME_MODES = {
    NORMAL: 'NORMAL',
    CHAOS: 'CHAOS',
};

(() => {
    const game = new Game(GAME_PARAMS);
    console.log(game);

    // game setup
    const mode = GAME_MODES.NORMAL;
    switch (mode) {
        case GAME_MODES.NORMAL:
            break;
        case GAME_MODES.CHAOS:
            for (const character of game.world.characters) {
                character.body.move(Vectors.create(Math.random() * 1, Math.random() * 1));
            }
            break;
        default:
            break;
    }

    // seed characters
    for (let i = 0; i < 5; i++) {
        const character = new Character();
        const randX = Math.floor((Math.random() * game.params.bounds.width));
        const randY = Math.floor((Math.random() * game.params.bounds.height));
        character.body.moveTo(randX, randY);
        const characterSprite = new Sprite(SPRITE_TYPE.CHARACTER, character);
        game.addCharacter(character, characterSprite);
    }

    // game loop (run ~60 times per second)
    setInterval(() => {
        game.update();
    }, 1000 / 60);

})();

