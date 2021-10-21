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

const GAME_MODES = {
    NORMAL: 'NORMAL',
    ONE: 'ONE',
    CHAOS: 'CHAOS',
};

const GAME_PARAMS = {
    mode: GAME_MODES.CHAOS,
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

const getRandomCoordinates = () => {
    const randX = Math.floor((Math.random() * GAME_PARAMS.bounds.width));
    const randY = Math.floor((Math.random() * GAME_PARAMS.bounds.height));
    return [ randX, randY ];
};

(() => {
    const game = new Game(GAME_PARAMS);
    console.log(game);

    // game setup
    switch (GAME_PARAMS.mode) {
        case GAME_MODES.NORMAL:
            break;
        case GAME_MODES.ONE:
            const character = new Character();
            character.body.moveTo(...getRandomCoordinates());
            const characterASprite = new CharacterSprite(character);
            game.addCharacter(character, characterASprite);
            break;
        case GAME_MODES.CHAOS:
            // seed characters
            for (let i = 0; i < 6; i++) {
                const character = new Character();

                character.body.moveTo(...getRandomCoordinates());
                character.move(Vectors.create(Math.random(), Math.random()));
                
                const characterSprite = new CharacterSprite(character);
                game.addCharacter(character, characterSprite);
            }
            break;
        default:
            break;
    }
})();

