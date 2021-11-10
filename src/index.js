import { Character } from './game/Character';
import { Game } from './game/Game';
import { Vectors } from './free-move/Vectors';
import { CharacterSprite } from './game/graphics/sprites/CharacterSprite';
import './main.css';
import { RectangleSprite } from './game/graphics/sprites/RectangleSprite';
import { CircleBody, RectangleBody } from './free-move/Bodies';

/*
    to-do list:
        - would tracking "contacts" on each body help prevent recalculating bodies already touching (and calculating bodies could collide into)?
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
    CHAOS_CIRCLES: 'CHAOS_CIRCLES',
    CHAOS_RANDOM_SHAPES: 'CHAOS_RANDOM_SHAPES',
    TERRAIN: 'TERRAIN',
};

const GAME_PARAMS = {
    mode: GAME_MODES.CHAOS_RANDOM_SHAPES,
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
            (() => {
                const character = new Character();
                character.moveTo(...getRandomCoordinates());
                const characterASprite = new CharacterSprite(character.body);
                game.addCharacter(character, characterASprite);
                
                const rectBodyA = new RectangleBody(1, 1);
                rectBodyA.name = 'RectA';
                rectBodyA.moveTo(4, 3);
                const rectASprite = new RectangleSprite(rectBodyA);
                game.addBody(rectBodyA, rectASprite);
            })();
            break;
        case GAME_MODES.CHAOS_CIRCLES:
            // seed characters
            for (let i = 0; i < 6; i++) {
                const character = new Character();

                character.moveTo(...getRandomCoordinates());
                character.move(Vectors.create(Math.random(), Math.random()));
                
                const characterSprite = new CharacterSprite(character.body);
                game.addCharacter(character, characterSprite);
            }
            break;
        case GAME_MODES.CHAOS_RANDOM_SHAPES:
            // seed characters
            for (let i = 0; i < 5; i++) {
                const isChar = Math.round(Math.random()); // 0 or 1

                const randomPosition = getRandomCoordinates();
                const randomVelocity = Vectors.create(Math.random(), Math.random());
                const isFixed = Math.round(Math.random()); // 0 or 1

                if (isChar) {
                    const character = new Character();

                    character.moveTo(...randomPosition);

                    if (isFixed) character.body.setFixed();
                    else character.move(randomVelocity);
                    
                    const characterSprite = new CharacterSprite(character.body);
                    game.addCharacter(character, characterSprite);
                } else {
                    const rectBody = new RectangleBody(1, 1);
                    rectBody.moveTo(...randomPosition);

                    if (isFixed) rectBody.setFixed();
                    else rectBody.setVelocity(Vectors.rescale(randomVelocity, game.player.movementSpeed));

                    const rectSprite = new RectangleSprite(rectBody);
                    game.addBody(rectBody, rectSprite);
                }
            }
            break;
        case GAME_MODES.TERRAIN:
            (() => {
                const rectBodyA = new RectangleBody(1, 1);
                rectBodyA.name = 'RectA';
                rectBodyA.moveTo(4, 3);
                const rectASprite = new RectangleSprite(rectBodyA);
                game.addBody(rectBodyA, rectASprite);

                const rectBodyB = new RectangleBody(1, 1);
                rectBodyB.name = 'RectB';
                rectBodyB.moveTo(1, 3);
                const rectBSprite = new RectangleSprite(rectBodyB);
                game.addBody(rectBodyB, rectBSprite);
            })();
            break;
        default:
            break;
    }
})();

