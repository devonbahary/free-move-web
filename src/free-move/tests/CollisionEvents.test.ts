import { CircleBody } from "../Bodies";
import { CollisionEvents } from "../CollisionEvents";
import { CircleBodyType } from "../types";
import { Vectors } from "../Vectors";
import {
    moveCirclesApartFromEachOther,
    moveCirclesAdjacentToEachOther,
    moveBodyAwayFromBody,
    moveBodyTowardsBody,
} from "./test.utils";

const SHOULD = 'should return a collision event';
const SHOULD_NOT = 'should NOT return any collision event';

describe('CollisionEvents', () => {
    describe('getCollisionEventsInChronologicalOrder()', () => {
        describe('circle vs circle', () => {
            let circleA: CircleBodyType;
            let circleB: CircleBodyType;
            let getCollisionEventsInChronologicalOrder: () => ReturnType<typeof CollisionEvents['getCollisionEventsInChronologicalOrder']>;
            
            beforeEach(() => {
                circleA = new CircleBody();
                circleB = new CircleBody();
                getCollisionEventsInChronologicalOrder = () => CollisionEvents.getCollisionEventsInChronologicalOrder([circleA, circleB], circleA);
            });

            describe('invalid collision events', () => {
                it(`${SHOULD_NOT} for two bodies that are not touching or moving`, () => {
                    moveCirclesApartFromEachOther(circleA, circleB);
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });
        
                it(`${SHOULD_NOT} for two bodies that are touching but not moving`, () => {
                    moveCirclesAdjacentToEachOther(circleA, circleB);
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });

                it(`${SHOULD_NOT} when one body is moving away from another body it is touching`, () => {
                    moveCirclesAdjacentToEachOther(circleA, circleB);
                    moveBodyAwayFromBody(circleA, circleB);
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });

                it(`${SHOULD_NOT} when one body is moving away from another body it isn't touching`, () => {
                    moveCirclesApartFromEachOther(circleA, circleB);
                    moveBodyAwayFromBody(circleA, circleB);
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });
            });

            describe('intersecting bodies (allow for movement out of another body)', () => {
                beforeEach(() => {
                    const posA = Vectors.create(0, 0);
                    const halfRadiusRightPos = Vectors.create(circleA.radius / 2, 0);
                    const posB = Vectors.add(posA, halfRadiusRightPos);
                    
                    circleA.moveTo(posA);
                    circleB.moveTo(posB);
                });
                
                it(`${SHOULD_NOT} when one body is moving towards another body that the moving body is already intersecting`, () => {
                    moveBodyTowardsBody(circleA, circleB);
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });

                it(`${SHOULD_NOT} when one body is moving away from another body that the moving body is already intersecting`, () => {
                    moveBodyAwayFromBody(circleA, circleB);
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });
            });

            describe('continous collision detection', () => {
                it(`${SHOULD} when one body is moving towards another body it is already touching`, () => {
                    moveCirclesAdjacentToEachOther(circleA, circleB);
                    moveBodyTowardsBody(circleA, circleB);
        
                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toMatchObject([
                        {
                            movingBody: circleA,
                            collisionBody: circleB,
                            timeOfCollision: 0,
                        },
                    ]);
                });

                it(`${SHOULD} when one body is moving towards another body with a movement path that would end within the other body`, () => {
                    circleA.moveTo(Vectors.create(0, 0));
                    circleB.moveTo(Vectors.create((circleA.radius + circleB.radius) * 2, 0));

                    const distanceBetween = Vectors.distance(circleB.center, circleA.center);

                    circleA.setVelocity(Vectors.create(distanceBetween, 0));

                    const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvent).toMatchObject({
                        movingBody: circleA,
                        collisionBody: circleB,
                    });
                    expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                    expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                });

                it(`${SHOULD} when one body is moving towards another body with a movement path that passes all the way through the other body (prevent tunneling)`, () => {
                    circleA.moveTo(Vectors.create(0, 0));
                    circleB.moveTo(Vectors.create((circleA.radius + circleB.radius) * 2, 0));

                    const distanceBetween = Vectors.distance(circleB.center, circleA.center);

                    circleA.setVelocity(Vectors.create(distanceBetween * 2, 0));

                    const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvent).toMatchObject({
                        movingBody: circleA,
                        collisionBody: circleB,
                    });
                    expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                    expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                });
    
                it(`${SHOULD_NOT} when one body is moving towards another body that is beyond the reach of the movement path (don't return future events)`, () => {
                    circleA.moveTo(Vectors.create(0, 0));
                    circleB.moveTo(Vectors.create((circleA.radius + circleB.radius) * 2, 0));

                    const distanceBetween = Vectors.distance(circleB.center, circleA.center);

                    circleA.setVelocity(Vectors.create(distanceBetween / 4, 0));

                    const collisionEvents = getCollisionEventsInChronologicalOrder();
                    expect(collisionEvents).toHaveLength(0);
                });
            });
        });
    });
});