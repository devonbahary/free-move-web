import { Element } from "../Element";
import { CharacterSprite } from "./CharacterSprite";

export class PlayerSprite extends CharacterSprite {
    getElement() {
        return Element.create('span', 'character', 'player');
    }
}
