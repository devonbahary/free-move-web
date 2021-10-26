import { Rectangle } from "./Bodies";
import { Vectors } from "./Vectors";

const quadratic = (a, b, c) => {
    return [
        (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
    ];
};

const isVerticalLine = (rect) => rect.x0 === rect.x1;

export class Collisions {
    static getMovementBoundingBox = (body) => {
        const { center, x0, x1, y0, y1, velocity } = body;
        const { x: dx, y: dy } = velocity;

        const rectX0 = dx === 0 ? x0 : dx > 0 ? center.x : x0 + dx;
        const rectX1 = dx === 0 ? x1 : dx > 0 ? x1 + dx : center.x;
        const rectY0 = dy === 0 ? y0 : dy > 0 ? center.y : y0 + dy;
        const rectY1 = dy === 0 ? y1 : dy > 0 ? y1 + dy : center.y;

        const width = rectX1 - rectX0;
        const height = rectY1 - rectY0;

        const rect = new Rectangle(width, height);
        rect.moveTo(rectX0, rectY0);

        return rect;
    }

    static getClosestVectorToRectFromCircle = (circle, rect) => {
        const closestXToRect = Math.max(rect.x0, Math.min(rect.x1, circle.center.x));
        const closestYToRect = Math.max(rect.y0, Math.min(rect.y1, circle.center.y));
        
        const closestPositionOnRect = { x: closestXToRect, y: closestYToRect };
        return Vectors.subtract(circle.center, closestPositionOnRect);
    }

    static isValidTimeOfCollision = (timeOfCollision) => {
        return Boolean(
            timeOfCollision !== null &&
            timeOfCollision <= 1 && 
            Math.round(timeOfCollision * 1000) / 1000 >= 0 // treat floating point errors like collisions so that they are not ignored (e.g., -7.082604849269798e-7)
        );
    }

    // TODO: this function would be more clear if it didn't ALSO include the logic of filtering undesired values
    // returns ~0 < t < 1 or null, where t is the distance along movement where collision happens
    static getTimeOfCollision = (a, b, c) => {
        const roots = quadratic(a, b, c);

        // roots can be outside the range of 0 < t < 1 because our broad approximations can be 
        // wrong; only when 0 < t < 1 will a collision actually occur
        return roots.reduce((timeOfCollision, root) => {
            if (!Collisions.isValidTimeOfCollision(root)) return timeOfCollision;

            return timeOfCollision === null || root < timeOfCollision ? root : timeOfCollision;
        }, null);
    };

    static getTimeOfCircleVsCircleCollision = (A, B) => {
        const { center: centerA, radius: radiusA, velocity } = A;
        const { x: Ax, y: Ay } = centerA;
        const { x: dx, y: dy } = velocity;

        const { center: centerB, radius: radiusB } = B;
        const { x: Bx, y: By } = centerB;

        /*
            sum of both radii               ===     distance between two radii
                    
            A.radius + B.radius              =      Math.sqrt((Ax(t) - Bx)^2 + (Ay(t) - By)^2)
            (A.radius + B.radius)^2          =      (Ax(t) - Bx)^2 + (Ay(t) - By)^2
                                             =      (((dx)t + Ax) - Bx)^2 + (((dy)t + Ay) - By)^2
                                             =      ((dx)t + Ax - Bx)^2 + ((dy)t + Ay - By)^2
                                             =      ((dx)^2t^2 + 2(Ax - Bx)(dx)t + (Ax - Bx)^2) 
                                                        + ((dy)^2t^2 + 2(Ay - By)(dy)t + (Ay - By)^2) 
                                             =      (dx^2 + dy^2)t^2 + (2(Ax - Bx)(dx) + 2(Ay - By)(dy))t + (Ax - Bx)^2 + (Ay - By)^2 
                            0                =      (dx^2 + dy^2)t^2 + (2(Ax - Bx)(dx) + 2(Ay - By)(dy))t + (Ax - Bx)^2 + (Ay - By)^2
                                                        - (this.radius + entity.radius)^2

            a = dx^2 + dy^2
            b = 2(Ax - Bx)(dx) + 2(Ay - By)(dy)
            c = (Ax - Bx)^2 + (Ay - By)^2 - (A.radius + B.radius)^2
        */

        const dABx = Ax - Bx;
        const dABy = Ay - By;
        
        const a = dx ** 2 + dy ** 2;
        const b = 2 * dx * dABx + 2 * dy * dABy;
        const c = dABx ** 2 + dABy ** 2 - (radiusA + radiusB) ** 2;

        return Collisions.getTimeOfCollision(a, b, c);
    }

    // only pass in circles A, B when their position (center) has been set for the * time * of collision
    static getCircleVsCircleCollisionVelocities = (A, B) => {
        /*
            2D Elastic Collision (angle-free)
            https://stackoverflow.com/questions/35211114/2d-elastic-ball-collision-physics

                                mass scalar      dot product (scalar)        magnitude        pos diff vector
                vA` = vA - (2mB / (mA + mB)) * (<vA - vB | xA - xB> / (|| xA - xB || ** 2)) * (xA - xB)
                  where v = velocity
                        m = mass
                        x = position (at time of collision)
        */

        const { center: xA, mass: mA, velocity: vA } = A;
        const { center: xB, mass: mB, velocity: vB } = B;

        const massScalar = (2 * mB) / (mA + mB);

        const diffVelocities = Vectors.subtract(vA, vB);
        const diffPositions = Vectors.subtract(xA, xB);
        const dotProduct = Vectors.dot(diffVelocities, diffPositions);

        const magnitude = Vectors.magnitude(diffPositions) ** 2;

        const coefficient = massScalar * (dotProduct / magnitude);
        const finalVelocityA = Vectors.subtract(vA, Vectors.mult(diffPositions, coefficient));

        /* 
            conservation of momentum
                mAvA` + mBvB` = mAvA + mBvB
                             sum
                vB` = (mAvA + mBvB - mAvA`) / mB
        */
            
        const sum = Vectors.subtract(
            Vectors.add(Vectors.mult(vA, mA), Vectors.mult(vB, mB)), 
            Vectors.mult(finalVelocityA, mA)
        );
        const finalVelocityB = Vectors.divide(sum, mB);
        
        return [ finalVelocityA, finalVelocityB ];
    }

    // https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
    static isCircleCollidedWithRectangle = (circle, rect) => {
        // use relative reference points
        const circleDistanceX = Math.abs(circle.center.x - rect.center.x);
        const circleDistanceY = Math.abs(circle.center.y - rect.center.y);

        const rectHalfWidth = rect.width / 2;
        const rectHalfHeight = rect.height / 2;

        // easy case where cirlce is too far from rectangle (either x- or y-axis)
        if (circleDistanceX > (rectHalfWidth + circle.radius)) return false;
        if (circleDistanceY > (rectHalfHeight + circle.radius)) return false;

        // easy case where circle is close enough to rectangle
        if (circleDistanceX <= (rectHalfWidth)) return true; 
        if (circleDistanceY <= (rectHalfHeight)) return true;

        // difficult case where circle may intersect corner of rectangle
        const cornerDistance = (circleDistanceX - rectHalfWidth) ** 2 + (circleDistanceY - rectHalfHeight) ** 2;

        return cornerDistance <= (circle.radius ** 2);
    }

    static areRectanglesColliding = (A, B) => {
        return (
            A.x0 < B.x0 + (B.x1 - B.x0) &&
            A.x0 + (A.x1 - A.x0) > B.x0 &&
            A.y0 < B.y0 + (B.y1 - B.y0) &&
            A.y0 + (A.y1 - A.y0) > B.y0
        );
    };

    // TODO: this won't apply to all rectangles, only works for boundary lines
    // either rename or rework to work globally for all rectangles
    static getTimeOfCircleVsRectangleCollision = (circle, rect) => {
        const { center, radius, velocity } = circle;
        const { x, y } = center;
        const { x: dx, y: dy } = velocity;

        const { x0, x1, y0, y1 } = rect;

        const getTimeOfAxisAlignedCollision = (circleBoundary, rectBoundary, changeInAxis) => {
            if (changeInAxis === 0) return null;

            return (rectBoundary - circleBoundary) / changeInAxis;
        };

        const validTimesOfCollision = [];

        // consider collision into rectangle against any of its sides
        const timeOfX0Collision = getTimeOfAxisAlignedCollision(x + radius, x0, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX0Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX0Collision;
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                validTimesOfCollision.push(timeOfX0Collision);
            }
        }

        const timeOfX1Collision = getTimeOfAxisAlignedCollision(x - radius, x1, dx);
        if (Collisions.isValidTimeOfCollision(timeOfX1Collision)) {
            const yAtTimeOfCollision = y + dy * timeOfX1Collision;
            if (yAtTimeOfCollision >= y0 && yAtTimeOfCollision <= y1) {
                validTimesOfCollision.push(timeOfX1Collision);
            }
        }

        const timeOfY0Collision = getTimeOfAxisAlignedCollision(y + radius, y0, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY0Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY0Collision;
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                validTimesOfCollision.push(timeOfY0Collision);
            }
        }

        const timeOfY1Collision = getTimeOfAxisAlignedCollision(y - radius, y1, dy);
        if (Collisions.isValidTimeOfCollision(timeOfY1Collision)) {
            const xAtTimeOfCollision = x + dx * timeOfY1Collision;
            if (xAtTimeOfCollision >= x0 && xAtTimeOfCollision <= x1) {
                validTimesOfCollision.push(timeOfY1Collision);
            }
        }

        return validTimesOfCollision.sort()[0] || null;
    }

    /*
        if the circle approaches an "x" boundary, flip x and conserve y
                              ... a "y" boundary, flip y and conserve x
    */
    static getElasticCircleVsInelasticRectangleCollisionVelocity = (circle, rect) => {
        const { x, y } = circle.velocity;
        if (isVerticalLine(rect)) {
            return Vectors.create(-x, y);
        } else {
            return Vectors.create(x, -y);
        }
    }

    static moveBodyToPointOfCollision = (body, timeOfCollision) => {
        const dx = body.velocity.x * timeOfCollision;
        const dy = body.velocity.y * timeOfCollision;
        body.moveTo(body.x + dx, body.y + dy);
    };
    
    static resolveCircleVsCircleCollision = (circleA, circleB, timeOfCollision) => {
        Collisions.moveBodyToPointOfCollision(circleA, timeOfCollision);
    
        if (circleA.isElastic && circleB.isElastic) {
            const [
                finalVelocityA,
                finalVelocityB,
            ] = Collisions.getCircleVsCircleCollisionVelocities(circleA, circleB);
    
            circleA.setVelocity(finalVelocityA);
            circleB.setVelocity(finalVelocityB);
        }
    };
    
    static resolveCircleVsRectangleCollision = (circle, rectangle, timeOfCollision) => {
        Collisions.moveBodyToPointOfCollision(circle, timeOfCollision);
    
        if (circle.isElastic) { // assume all rectangles are inelastic
            const newVector = Collisions.getElasticCircleVsInelasticRectangleCollisionVelocity(circle, rectangle);
            circle.setVelocity(newVector);
        }
    };

    static isMovingTowardsBody = (bodyA, bodyB) => {
        if (bodyB.isCircle) {
            // https://math.stackexchange.com/questions/1438002/determine-if-objects-are-moving-towards-each-other
            const diffVelocity = Vectors.neg(bodyA.velocity); // v2 - v1, except we don't want to consider whether bodyB is moving towards bodyA
            const diffPosition = Vectors.subtract(bodyB.center, bodyA.center);
            return Vectors.dot(diffVelocity, diffPosition) < 0;
        }

        const vectorToRect = Collisions.getClosestVectorToRectFromCircle(bodyA, bodyB);
        const { velocity: velocityA } = bodyA;
        return Boolean(
            (velocityA.x && vectorToRect.x && Math.sign(velocityA.x) !== Math.sign(vectorToRect.x)) ||
            (velocityA.y && vectorToRect.y && Math.sign(velocityA.y) !== Math.sign(vectorToRect.y))
        );
    }

}