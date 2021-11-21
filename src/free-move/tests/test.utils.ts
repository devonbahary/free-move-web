import { BodyType, CircleBodyType } from "../types";
import { isCircleBody, isRectBody } from "../Bodies";
import { Vectors } from "../Vectors";

// get diameter / longest rect side
export const getBodyLength = (body: BodyType) => {
    if (isCircleBody(body)) return body.radius * 2;
    if (isRectBody(body)) return Math.max(body.width, body.height) * 2;
    throw new Error(`cannot getBodyLength for unrecognized body ${JSON.stringify(body)}`);
}

export const moveCirclesAdjacentToEachOther = (circleA: CircleBodyType, circleB: CircleBodyType) => {
    const x = 1;
    const y = 1;
    
    circleA.moveTo(Vectors.create(x, y));
    circleB.moveTo(Vectors.create(x + circleA.radius + circleB.radius, y));
};

export const moveCirclesApartFromEachOther = (circleA: CircleBodyType, circleB: CircleBodyType) => {
    const x = 1;
    const y = 1;
    const distance = (circleA.radius + circleB.radius) * 2;
    
    circleA.moveTo(Vectors.create(x, y));
    circleB.moveTo(Vectors.create(x + distance, y));
};

export const moveBodyTowardsBody = (bodyA: BodyType, bodyB: BodyType) => {
    const diffPosition = Vectors.subtract(bodyB.center, bodyA.center);
    // set velocity such that the movement path travels all the way through bodyB to ensure we observe all collision opportunities
    const bodiesLength = (getBodyLength(bodyA) + getBodyLength(bodyB)) * 2;
    const vel = Vectors.rescale(diffPosition, bodiesLength);
    bodyA.setVelocity(vel);
}

export const moveBodyAwayFromBody = (bodyA: BodyType, bodyB: BodyType) => {
    const diffPosition = Vectors.subtract(bodyA.center, bodyB.center);
    bodyA.setVelocity(diffPosition);
}