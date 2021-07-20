import { Control } from './classes/Control';
import { World } from './classes/entities/World';
import './main.css';

const gameParams = {
    bounds: {
        width: 24,
        height: 16,
    },
};

const world = new World(gameParams.bounds.width, gameParams.bounds.height);
new Control(world);

setInterval(() => {
    world.update();
}, 1000 / 60);