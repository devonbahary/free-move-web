import { Element } from "../Element";

export class PlayPauseButtonSprite {
    constructor(game) {
        this.game = game;
        this.isPausedMem = null;
        this.initElement();
    }

    static get playButtonHTML() { return '<ion-icon name="play"></ion-icon>'; };
    static get pauseButtonHTML() { return '<ion-icon name="pause"></ion-icon>'; };

    initElement() {
        this.element = Element.create('button', undefined, 'play-pause-button'); 
        this.updatePlayPauseButtonHTML();
        this.element.onclick = () => this.togglePlayPause();
    }

    updatePlayPauseButtonHTML() {
        this.element.innerHTML = this.game.isPaused 
            ? PlayPauseButtonSprite.playButtonHTML
            : PlayPauseButtonSprite.pauseButtonHTML;
    }

    togglePlayPause() {
        this.game.togglePlayPause();
    }

    update() {
        if (this.isPausedMem !== this.game.isPaused) {
            this.updatePlayPauseButtonHTML();
            this.isPausedMem = this.game.isPaused;
        }
    }
}