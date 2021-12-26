import { Vectors } from '../../free-move/vectors/Vectors';

export class GameEntity {
    constructor() {
        this.movementSpeed = 0.05;
    }

    move(movementVector) {
        const maxMag = Math.max(Vectors.magnitude(this.body.velocity), this.movementSpeed);
        const movementForce = Vectors.rescale(movementVector, this.movementSpeed); 
        
        this.body.applyForce(movementForce);
        // never let character movement exceed movement speed
        if (Vectors.magnitude(this.body.velocity) > maxMag) {
            this.body.setVelocity(Vectors.rescale(this.body.velocity, maxMag));
        }
    }

    moveTo(positionVector) {
        this.body.moveTo(positionVector);
    }
}
