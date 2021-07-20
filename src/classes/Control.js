import { vector } from "../utilities";

export class Control {
    constructor(world) {
        document.onkeydown = this.onkeydown;
        this.world = world;
    }

    get player() {
        return this.world.player;
    }

    onkeydown = (keyboardEvent) => {
        const movement = 0.1;
        switch (keyboardEvent.key) {
            case 'ArrowRight':
                keyboardEvent.preventDefault();
                this.player.move(vector(movement, 0));
                break;
            case 'ArrowUp':
                keyboardEvent.preventDefault();
                this.player.move(vector(0, -movement));
                break;
            case 'ArrowLeft':
                keyboardEvent.preventDefault();
                this.player.move(vector(-movement, 0));
                break;
            case 'ArrowDown':
                keyboardEvent.preventDefault();
                this.player.move(vector(0, movement));
                break;
            default:
                break;
        }
    }
}