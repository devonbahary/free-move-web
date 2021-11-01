import { Character } from './game/Character';
import { Game } from './game/Game';
import { Vectors } from './free-move/Vectors';
import { CharacterSprite } from './game/graphics/sprites/CharacterSprite';
import './main.css';
import { RectangleSprite } from './game/graphics/sprites/RectangleSprite';
import { RectangleBody } from './free-move/Bodies';

/*
    to-do list:
        - rethink fixed property not being able to have velocity, because we may want to be able to move "fixed" characters
            - repercussions, what does it look like for a fixed character to move into a fixed character?
        - inelastic collisions with another circle / rectangle
            - implement "sliding" or "glancing" 
        - investigate weird "jumping" / teleporting behavior when moving immobile elastic entities
        - investigate why player mass of 500 would make collisions "stick" to it
*/

const GAME_MODES = {
    NORMAL: 'NORMAL',
    ONE: 'ONE',
    CHAOS: 'CHAOS',
    TERRAIN: 'TERRAIN',
};

const GAME_PARAMS = {
    mode: GAME_MODES.TERRAIN,
    bounds: {
        width: 7,
        height: 7,
    },
    player: {
        startPosition: {
            x: 2,
            y: 3,
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
            character.moveTo(...getRandomCoordinates());
            const characterASprite = new CharacterSprite(character.body);
            game.addCharacter(character, characterASprite);
            break;
        case GAME_MODES.CHAOS:
            // seed characters
            for (let i = 0; i < 6; i++) {
                const character = new Character();

                character.moveTo(...getRandomCoordinates());
                character.move(Vectors.create(Math.random(), Math.random()));
                
                const characterSprite = new CharacterSprite(character.body);
                game.addCharacter(character, characterSprite);
            }
            break;
        case GAME_MODES.TERRAIN:
            const rectBody = new RectangleBody(1, 1);
            rectBody.moveTo(4, 3);
            const rectSprite = new RectangleSprite(rectBody);
            game.addBody(rectBody, rectSprite);
            break;
        default:
            break;
    }
})();

