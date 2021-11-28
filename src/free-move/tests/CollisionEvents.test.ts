import { CircleBody } from "../Bodies";
import { CollisionEvents } from "../CollisionEvents";
import { Maths } from "../Maths";
import { CircleBodyType } from "../types";
import { Vectors } from "../Vectors";
import {
    Direction,
    TestUtils,
} from "./TestUtils";

const SHOULD = 'should return a collision event';
const SHOULD_NOT = 'should NOT return any collision event';

describe('CollisionEvents', () => {
    describe('getCollisionEventsInChronologicalOrder()', () => {
        for (const dir of Object.values(Direction)) {
            describe(`circle vs circle (${dir})`, () => {
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
                        TestUtils.moveCirclesApartFromEachOther(circleA, circleB, dir);
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
            
                    it(`${SHOULD_NOT} for two bodies that are touching but not moving`, () => {
                        TestUtils.moveCirclesAdjacentToEachOther(circleA, circleB, dir);
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
    
                    it(`${SHOULD_NOT} when one body is moving away from another body it is touching`, () => {
                        TestUtils.moveCirclesAdjacentToEachOther(circleA, circleB, dir);
                        TestUtils.moveBodyAwayFromBody(circleA, circleB);
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
    
                    it(`${SHOULD_NOT} when one body is moving away from another body it isn't touching`, () => {
                        TestUtils.moveCirclesApartFromEachOther(circleA, circleB, dir);
                        TestUtils.moveBodyAwayFromBody(circleA, circleB);
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
                });
    
                describe('intersecting bodies (allow for movement out of another body)', () => {
                    beforeEach(() => {
                        TestUtils.moveCirclesIntoEachOther(circleA, circleB, dir);
                    });
                    
                    it.skip(`${SHOULD_NOT} when one body is moving towards another body that the moving body is already intersecting`, () => {
                        TestUtils.moveBodyTowardsBody(circleA, circleB);
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
    
                    it(`${SHOULD_NOT} when one body is moving away from another body that the moving body is already intersecting`, () => {
                        TestUtils.moveBodyAwayFromBody(circleA, circleB);
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
                });
    
                describe('continous collision detection', () => {
                    it(`${SHOULD} when one body is moving towards another body it is already touching`, () => {
                        TestUtils.moveCirclesAdjacentToEachOther(circleA, circleB, dir);
                        TestUtils.moveBodyTowardsBody(circleA, circleB);
            
                        const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvent).toMatchObject({
                            movingBody: circleA,
                            collisionBody: circleB,
                        });

                        expect(Maths.roundFloatingPoint(collisionEvent.timeOfCollision)).toBe(0);
                    });
    
                    it(`${SHOULD} when one body is moving towards another body with a movement path that would end within the other body`, () => {
                        TestUtils.moveCirclesApartFromEachOther(circleA, circleB, dir);
    
                        const diffPos = Vectors.subtract(circleB.center, circleA.center);
    
                        circleA.setVelocity(diffPos);
    
                        const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvent).toMatchObject({
                            movingBody: circleA,
                            collisionBody: circleB,
                        });
                        expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                        expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                    });
    
                    it(`${SHOULD} when one body is moving towards another body with a movement path that passes all the way through the other body (prevent tunneling)`, () => {
                        TestUtils.moveCirclesApartFromEachOther(circleA, circleB, dir);
    
                        const diffPos = Vectors.subtract(circleB.center, circleA.center);
                        const twiceDiffPos = Vectors.rescale(diffPos, Vectors.magnitude(diffPos) * 2);
    
                        circleA.setVelocity(twiceDiffPos);
    
                        const [ collisionEvent ] = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvent).toMatchObject({
                            movingBody: circleA,
                            collisionBody: circleB,
                        });
                        expect(collisionEvent.timeOfCollision).toBeGreaterThan(0);
                        expect(collisionEvent.timeOfCollision).toBeLessThanOrEqual(1);
                    });
        
                    it(`${SHOULD_NOT} when one body is moving towards another body that is beyond the reach of the movement path (don't return future events)`, () => {
                        TestUtils.moveCirclesApartFromEachOther(circleA, circleB, dir);
    
                        const diffPos = Vectors.subtract(circleB.center, circleA.center);
    
                        circleA.setVelocity(Vectors.rescale(diffPos, 0.5));
    
                        const collisionEvents = getCollisionEventsInChronologicalOrder();
                        expect(collisionEvents).toHaveLength(0);
                    });
                });
    
                describe("tangential movement (don't recognize collision events for grazing bodies)", () => {
                    beforeEach(() => {
                        TestUtils.moveCirclesAdjacentToEachOther(circleA, circleB, dir);
                    });

                    it(`${SHOULD_NOT} when a body moves tangentially to another body`, () => {
                        const diffPos = Vectors.subtract(circleB.center, circleA.center);
                        const tangentVectors = Vectors.normalVectors(diffPos);
                        
                        for (const tangent of tangentVectors) {
                            circleA.setVelocity(tangent);
                            const collisionEvents = getCollisionEventsInChronologicalOrder();
                            expect(collisionEvents).toHaveLength(0);
                        }

                    });
                });
            });   
        }
    });
});