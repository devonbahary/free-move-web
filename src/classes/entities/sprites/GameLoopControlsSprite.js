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
    static get stepForwardButtonHTML() { return '<ion-icon name="skip-forward"></ion-icon>'; };

    initElement() {
        this.element = Element.create('div', undefined, 'game-loop-controls');
        
        this.playPauseButtonElement = Element.create('button'); 
        this.playPauseButtonElement.onclick = () => this.togglePlayPause();

        this.element.appendChild(this.playPauseButtonElement);
    }

    updatePlayPauseButtonHTML(isPaused) {
        this.playPauseButtonElement.innerHTML = isPaused 
            ? GameLoopControlsSprite.playButtonHTML
            : GameLoopControlsSprite.pauseButtonHTML;
    }

    stepForwardInLoop() {
        this.game.update(true);
    }

    togglePlayPause() {
        this.game.togglePlayPause();
    }

    update() {
        this.observeGameIsPaused = this.observeGameIsPaused(this.game.isPaused);
    }

    onGamePauseChange(isPaused) {
        this.updatePlayPauseButtonHTML(isPaused);
        if (isPaused) {
            const stepForwardButtonElement = Element.create('button'); 
            stepForwardButtonElement.onclick = () => this.stepForwardInLoop();
            stepForwardButtonElement.innerHTML = GameLoopControlsSprite.stepForwardButtonHTML;
            
            this.stepForwardButtonElement = stepForwardButtonElement;
            this.element.appendChild(this.stepForwardButtonElement);
        } else if (this.stepForwardButtonElement) {
            this.stepForwardButtonElement.remove();
        }
    }
}