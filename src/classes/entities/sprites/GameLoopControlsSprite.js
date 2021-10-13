import { observer } from "../../../utilities/observer";
import { Element } from "../Element";

export class GameLoopControlsSprite {
    constructor(game) {
        this.game = game;
        this.initElement();
        this.observeGameIsPaused = observer(null, this.onGamePauseChange.bind(this));
    }

    static get playButtonHTML() { return '<ion-icon name="play"></ion-icon>'; };
    static get pauseButtonHTML() { return '<ion-icon name="pause"></ion-icon>'; };

    initElement() {
        this.element = Element.create('div');
        
        this.playPauseButtonElement = Element.create('button', undefined, 'play-pause-button'); 
        this.playPauseButtonElement.onclick = () => this.togglePlayPause();

        this.element.appendChild(this.playPauseButtonElement);
    }

    updatePlayPauseButtonHTML(isPaused) {
        this.playPauseButtonElement.innerHTML = isPaused 
            ? GameLoopControlsSprite.playButtonHTML
            : GameLoopControlsSprite.pauseButtonHTML;
    }

    togglePlayPause() {
        this.game.togglePlayPause();
    }

    update() {
        this.observeGameIsPaused = this.observeGameIsPaused(this.game.isPaused);
    }

    onGamePauseChange(isPaused) {
        this.updatePlayPauseButtonHTML(isPaused);
    }
}