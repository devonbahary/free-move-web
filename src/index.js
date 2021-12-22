import { CircleEntity } from './game/game-entities/CircleEntity';
import { Game } from './game/Game';
import { Vectors } from './free-move/vectors/Vectors';
import { CircleSprite } from './game/graphics/sprites/CircleSprite';
import './main.css';
import { RectSprite } from './game/graphics/sprites/RectSprite';
import { RectEntity } from './game/game-entities/RectEntity';

/*
    to-do list:
        - investigate "stick" on horizontal movement of circle into rect corner
        - would tracking "contacts" on each body help prevent recalculating bodies already touching (and calculating bodies could collide into)?
        - rethink fixed property not being able to have velocity, because we may want to be able to move "fixed" characters
            - repercussions, what does it look like for a fixed character to move into a fixed character?
        - inelastic collisions with another circle / rectangle
            - implement "sliding" or "glancing" 
    

    THOUGHTS:
        - on fixed movement
            - unclear how we want to handle fixed bodies + movement
                - how to handle a fixed body (infinite mass) in a collision?
                    - [easy] non-fixed vs fixed: just reflect the non-fixed body off the fixed
                    - [?] fixed vs non-fixed: add fixed velocity to non-fixed?
                    - [?] fixed vs fixed: don't resolve collision (need to make sure fixed bodies don't move things like the environment)
                - fixed bodies could never have velocity and only moveTo a new location
                
                
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
    const randX = Math.floor(Math.random() * GAME_PARAMS.bounds.width);
    const randY = Math.floor(Math.random() * GAME_PARAMS.bounds.height);
    return { x: randX, y: randY };
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
                const rectA = new RectEntity();
                rectA.moveTo({ x: 0, y: 2 });
                rectA.move({ x: 0.05, y: 0.05 });
                const rectASprite = new RectSprite(rectA.body);
                game.addGameEntity(rectA, rectASprite);

                const rectB = new RectEntity();
                rectB.moveTo({ x: 1, y: 3 });
                rectB.body.setFixed();
                const rectBSprite = new RectSprite(rectB.body);
                game.addGameEntity(rectB, rectBSprite);
            })();
            break;
        case GAME_MODES.CHAOS_CIRCLES:
            for (let i = 0; i < 6; i++) {
                const circle = new CircleEntity();

                circle.moveTo(getRandomCoordinates());
                circle.move(Vectors.create(Math.random(), Math.random()));

                const characterSprite = new CircleSprite(circle.body);
                game.addGameEntity(circle, characterSprite);
            }
            break;
        case GAME_MODES.CHAOS_RANDOM_SHAPES:
            for (let i = 0; i < 8; i++) {
                const isChar = Math.round(Math.random()); // 0 or 1

                const randomPosition = getRandomCoordinates();
                const randomVelocity = Vectors.create(Math.random(), Math.random());
                const isFixed = Math.round(Math.random()); // 0 or 1

                if (isChar) {
                    const circle = new CircleEntity();

                    circle.moveTo(randomPosition);

                    if (isFixed) circle.body.setFixed();
                    else circle.move(randomVelocity);

                    const characterSprite = new CircleSprite(circle.body);
                    game.addGameEntity(circle, characterSprite);
                } else {
                    const rect = new RectEntity();
                    rect.moveTo(randomPosition);

                    if (isFixed) rect.body.setFixed();
                    else rect.move(randomVelocity);

                    const rectSprite = new RectSprite(rect.body);
                    game.addGameEntity(rect, rectSprite);
                }
            }
            break;
        case GAME_MODES.TERRAIN:
            (() => {
                const rectA = new RectEntity();
                rectA.moveTo({ x: 4, y: 3 });
                const rectASprite = new RectSprite(rectA.body);
                game.addGameEntity(rectA, rectASprite);

                const rectB = new RectEntity();
                rectB.moveTo({ x: 1, y: 3 });
                const rectBSprite = new RectSprite(rectB.body);
                game.addGameEntity(rectB, rectBSprite);
            })();
            break;
        default:
            break;
    }
})();
