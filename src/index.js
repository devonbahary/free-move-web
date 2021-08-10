import { Character } from './classes/entities/Character';
import { game, gameParams} from './classes/Game';
import './main.css';

for (let i = 0; i < 3; i++) {
/*
    to-do list:
        - inelastic collisions with another circle / rectangle
            - implement "sliding" or "glancing" 
        - investigate weird "jumping" / teleporting behavior when moving immobile elastic entities
        - apply force instead of just setting velocity in move()
*/

    const character = new Character();
    const randX = Math.floor((Math.random() * gameParams.bounds.width));
    const randY = Math.floor((Math.random() * gameParams.bounds.height));
    character.moveTo(randX, randY);
    game.world.addCharacter(character);
}

setInterval(() => {
    game.update();
}, 1000 / 60);
