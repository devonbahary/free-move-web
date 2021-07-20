import { Control } from './classes/Control';
import { World } from './classes/entities/World';
import './main.css';

const gameParams = {
    bounds: {
        width: 25,
        height: 15,
    },
    player: {
        startCoord: {
            x: 12,
            y: 7,
        },
    },
};

const world = new World(gameParams.bounds, gameParams.player.startCoord);
new Control(world);

setInterval(() => {
    world.update();
}, 1000 / 60);