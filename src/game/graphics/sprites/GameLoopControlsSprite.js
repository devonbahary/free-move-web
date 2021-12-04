import { Element } from '../Element';
import { observer } from '../../utilities/observer';

export class GameLoopControlsSprite {
    constructor(game) {
        this.game = game;
        this.initElement();
        this.observeGameIsPaused = observer(null, this.onGamePauseChange.bind(this));
    }

    static get playButtonHTML() {
        return '<ion-icon name="play"></ion-icon>';
    }
    static get pauseButtonHTML() {
        return '<ion-icon name="pause"></ion-icon>';
    }
    static get stepForwardButtonHTML() {
        return '<ion-icon name="skip-forward"></ion-icon>';
    }
    static get stepBackwardButtonHTML() {
        return '<ion-icon name="skip-backward"></ion-icon>';
    }

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

    togglePlayPause() {
        this.game.togglePlayPause();
    }

    update() {
        this.observeGameIsPaused = this.observeGameIsPaused(this.game.isPaused);
    }

    onGamePauseChange(isPaused) {
        this.updatePlayPauseButtonHTML(isPaused);
        if (isPaused) {
            this.stepForwardButtonElement = GameLoopControlsSprite.createGameLoopButton(
                () => this.game.stepForward(),
                GameLoopControlsSprite.stepForwardButtonHTML,
            );
            this.element.appendChild(this.stepForwardButtonElement);

            this.stepBackwardButtonElement = GameLoopControlsSprite.createGameLoopButton(
                () => this.game.stepBackward(),
                GameLoopControlsSprite.stepBackwardButtonHTML,
            );
            this.element.insertBefore(this.stepBackwardButtonElement, this.playPauseButtonElement);
        } else if (this.stepForwardButtonElement) {
            this.stepForwardButtonElement.remove();
            this.stepBackwardButtonElement.remove();
        }
    }

    static createGameLoopButton(onclick, innerHTML) {
        const element = Element.create('button');
        element.onclick = onclick;
        element.innerHTML = innerHTML;
        return element;
    }
}
