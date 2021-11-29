import { CircleBody, RectBody } from "../Bodies";
import { CollisionEvents } from "../CollisionEvents";
import { Maths } from "../Maths";
import { BodyType, CollisionEvent, Vector } from "../types";
import { Vectors } from "../Vectors";
import {
    CollisionType,
    Direction,
    TestUtils,
} from "./TestUtils";

const SHOULD = 'should return a collision event';
const SHOULD_NOT = 'should NOT return any collision event';

const expectZeroTimeOfCollision = (collisionEvent: CollisionEvent) => {
    expect(Maths.roundFloatingPoint(collisionEvent.timeOfCollision) === 0).toBe(true);
};

describe('CollisionEvents', () => {
    describe('getCollisionEventsInChronologicalOrder()', () => {
        let bodyA: BodyType;
        let bodyB: BodyType;
        let getCollisionEventsInChronologicalOrder: () => ReturnType<typeof CollisionEvents['getCollisionEventsInChronologicalOrder']>;
                
        const expectNoCollisionEvents = () => {
            const collisionEvents = getCollisionEventsInChronologicalOrder();
            expect(collisionEvents).toHaveLength(0);
        }

        for (const dir of Object.values(Direction)) {
            for (const collisionType of Object.values(CollisionType)) {
                let getDiffPos: () => Vector;
                
                describe(`${collisionType} (${dir})`, () => {
                    beforeEach(() => {
                        switch (collisionType) {
                            case CollisionType.circleVsCircle:
                                bodyA = new CircleBody();
                                bodyB = new CircleBody();
                                break;
                            case CollisionType.rectVsRect:
                                bodyA = new RectBody();
                                bodyB = new RectBody();
                                break;
                            default:
                                throw new Error(`unrecognized CollisionType ${collisionType}`);
                        }
                        getCollisionEventsInChronologicalOrder = () => CollisionEvents.getCollisionEventsInChronologicalOrder([bodyA, bodyB], bodyA);
                        getDiffPos = () => Vectors.subtract(bodyB.center, bodyA.center);
                    });
        
                    describe('invalid collision events', () => {
                        it(`${SHOULD_NOT} for two bodies that are not touching or moving`, () => {
                            TestUtils.moveBodiesApartFromEachOther(bodyA, bodyB, dir);
                            expectNoCollisionEvents();
                        });
                
                        it(`${SHOULD_NOT} for two bodies that are touching but not moving`, () => {
                            TestUtils.moveBodiesAdjacentToEachOther(bodyA, bodyB, dir);
                            expectNoCollisionEvents();
                        });
        
                        it(`${SHOULD_NOT} when one body is moving away from another body it is touching`, () => {
                            TestUtils.moveBodiesAdjacentToEachOther(bodyA, bodyB, dir);
                            TestUtils.moveBodyAwayFromBody(bodyA, bodyB);
                            expectNoCollisionEvents();
                        });
        
                        it(`${SHOULD_NOT} when one body is moving away from another body it isn't touching`, () => {
                            TestUtils.moveBodiesApartFromEachOther(bodyA, bodyB, dir);
                            TestUtils.moveBodyAwayFromBody(bodyA, bodyB);
                            expectNoCollisionEvents();
                        });
                    });
        
                    describe('intersecting bodies (allow for movement out of another body)', () => {
                        beforeEach(() => {
                            TestUtils.moveBodiesIntoEachOther(bodyA, bodyB, dir);
                        });
                        
                        it.skip(`${SHOULD_NOT} when one body is moving towards another body that the moving body is already intersecting`, () => {
                            TestUtils.moveBodyTowardsBody(bodyA, bodyB);
                            expectNoCollisionEvents();
                        });
        
                        it(`${SHOULD_NOT} when one body is moving away from another body that the moving body is already intersecting`, () => {
                            TestUtils.moveBodyAwayFromBody(bodyA, bodyB);
                            expectNoCollisionEvents();
                        });
                    });
        
                    describe('continous collision detection', () => {
                        it(`${SHOULD} when one body is moving towards another body it is already touching`, () => {
                            TestUtils.moveBodiesAdjacentToEachOther(bodyA, bodyB, dir);
                            TestUtils.moveBodyTowardsBody(bodyA, bodyB);
                
                            const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                            expect(collisionEvent).toMatchObject({
                                movingBody: bodyA,
                                collisionBody: bodyB,
                            });
    
                            expectZeroTimeOfCollision(collisionEvent);
                        });
        
                        it(`${SHOULD} when one body is moving towards another body with a movement path that would end within the other body`, () => {
                            TestUtils.moveBodiesApartFromEachOther(bodyA, bodyB, dir);
        
                            const diffPos = getDiffPos();
                            bodyA.setVelocity(diffPos);
        
                            const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                            expect(collisionEvent).toMatchObject({
                                movingBody: bodyA,
                                collisionBody: bodyB,
                            });
                            expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                            expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                        });
        
                        it(`${SHOULD} when one body is moving towards another body with a movement path that passes all the way through the other body (prevent tunneling)`, () => {
                            TestUtils.moveBodiesApartFromEachOther(bodyA, bodyB, dir);
        
                            const diffPos = getDiffPos();
                            const twiceDiffPos = Vectors.rescale(diffPos, Vectors.magnitude(diffPos) * 2);
                            bodyA.setVelocity(twiceDiffPos);
        
                            const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                            expect(collisionEvent).toMatchObject({
                                movingBody: bodyA,
                                collisionBody: bodyB,
                            });
                            expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                            expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                        });
            
                        it(`${SHOULD_NOT} when one body is moving towards another body that is beyond the reach of the movement path (don't return future events)`, () => {
                            TestUtils.moveBodiesApartFromEachOther(bodyA, bodyB, dir);
        
                            const diffPos = getDiffPos();
                            bodyA.setVelocity(Vectors.rescale(diffPos, 0.5));
        
                            expectNoCollisionEvents();
                        });
                    });
        
                    describe("tangential movement (don't recognize collision events for grazing bodies)", () => {
                        beforeEach(() => {
                            TestUtils.moveBodiesAdjacentToEachOther(bodyA, bodyB, dir);
                        });
    
                        it(`${SHOULD_NOT} when a body moves tangentially to another body`, () => {
                            const tangentialVectors = TestUtils.getTangentialMovementVectors(bodyA, bodyB, dir, getDiffPos);
                            
                            for (const tangent of tangentialVectors) {
                                bodyA.setVelocity(tangent);
                                expectNoCollisionEvents();
                            }
    
                        });
                    });
                });   
            }
        }
    });
});