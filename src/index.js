import { Character } from './classes/entities/Character';
import { Game } from './classes/Game';
import { Vectors } from './utilities/Vectors';
import './main.css';
import { CharacterSprite } from './classes/entities/sprites/CharacterSprite';

/*
    to-do list:
        - inelastic collisions with another circle / rectangle
            - implement "sliding" or "glancing" 
        - investigate weird "jumping" / teleporting behavior when moving immobile elastic entities
        - investigate why player mass of 500 would make collisions "stick" to it
*/

const GAME_PARAMS = {
    bounds: {
        width: 5,
        height: 5,
    },
    player: {
        startPosition: {
            x: 2,
            y: 2,
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
                character.body.setVelocity(Vectors.create(Math.random() * 1, Math.random() * 1));
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
        const characterSprite = new CharacterSprite(character);
        game.addCharacter(character, characterSprite);
    }

})();

