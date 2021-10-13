import { Character } from './classes/entities/Character';
import { Game, gameParams} from './classes/Game';
import { Vectors } from './utilities/Vectors';
import './main.css';
import { Sprite, SPRITE_TYPE } from './classes/entities/Sprite';

/*
    to-do list:
        - inelastic collisions with another circle / rectangle
            - implement "sliding" or "glancing" 
        - investigate weird "jumping" / teleporting behavior when moving immobile elastic entities
        - apply force instead of just setting velocity in move()
*/

const GAME_MODES = {
    NORMAL: 'NORMAL',
    CHAOS: 'CHAOS',
};

const gameMode = GAME_MODES.NORMAL;

const game = new Game();

const gameSetup = () => {
    switch (gameMode) {
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
};

const seedCharacters = () => {
    for (let i = 0; i < 5; i++) {
        const character = new Character();
        const randX = Math.floor((Math.random() * gameParams.bounds.width));
        const randY = Math.floor((Math.random() * gameParams.bounds.height));
        character.body.moveTo(randX, randY);
        const characterSprite = new Sprite(SPRITE_TYPE.CHARACTER, character);
        game.addCharacter(character, characterSprite);
    }
};

setInterval(() => {
    game.update();
}, 1000 / 60);

seedCharacters();
gameSetup();

