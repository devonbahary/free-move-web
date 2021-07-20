import { World } from './classes/World';
import './main.css';

const gameParams = {
    bounds: {
        width: 400,
        height: 400,
    },
};

const world = new World(gameParams.bounds.width, gameParams.bounds.height);

setInterval(() => {
    world.update();
}, 1000 / 60);