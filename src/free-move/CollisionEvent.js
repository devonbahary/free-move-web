export class CollisionEvent {
    constructor(movingBody, collisionBody, timeOfCollision, contact) {
        this.movingBody = movingBody;
        this.collisionBody = collisionBody;
        this.timeOfCollision = timeOfCollision;
        this.contact = contact;
    }
}
