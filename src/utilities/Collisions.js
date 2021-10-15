import { Vectors } from "./Vectors";

const quadratic = (a, b, c) => {
    return [
        (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
    ];
};

const isVerticalLine = (rect) => rect.x0 === rect.x1;

export class Collisions {
    static getMovementBoundingBox = (character) => {
        const { center, x0, x1, y0, y1, velocity } = character;
        const { x: dx, y: dy } = velocity;

        return {
            x0: dx === 0 ? x0 : dx > 0 ? center.x : x0 + dx,
            x1: dx === 0 ? x1 : dx > 0 ? x1 + dx : center.x,
            y0: dy === 0 ? y0 : dy > 0 ? center.y : y0 + dy,
            y1: dy === 0 ? y1 : dy > 0 ? y1 + dy : center.y,
        };
    }

    // returns 0 > t > 1 or null, where t is the distance along movement where collision happens
    static getTimeOfCollision = (a, b, c) => {
        const roots = quadratic(a, b, c);

        const validRoots = roots.filter(t => t <= 1);

        if (!validRoots.length) {
            return null;
        }
        
        return Math.min(...validRoots);
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

    static isCircleCollidedWithRectangle = (distanceToRectangle, circleRadius) => {
        return distanceToRectangle < circleRadius;
    }

    static areRectanglesColliding = (A, B) => {
        return (
            A.x0 < B.x0 + (B.x1 - B.x0) &&
            A.x0 + (A.x1 - A.x0) > B.x0 &&
            A.y0 < B.y0 + (B.y1 - B.y0) &&
            A.y0 + (A.y1 - A.y0) > B.y0
        );
    };

    static getTimeOfCircleVsRectangleCollision = (circle, rect) => {
        const { center, radius, velocity } = circle;
        const { x: x1, y: y1 } = center;
        const { x: dx, y: dy } = velocity;

        let a, b, c;
        if (isVerticalLine(rect)) {
            a = dx ** 2;
            b = 2 * x1 * dx - 2 * rect.x0 * dx;
            c = rect.x0 ** 2 + x1 ** 2 - 2 * rect.x0 * x1 - radius ** 2;
        } else {
            a = dy ** 2;
            b = 2 * y1 * dy - 2 * rect.y0 * dy;
            c = rect.y0 ** 2 + y1 ** 2 - 2 * rect.y0 * y1 - radius ** 2;
        }

        return Collisions.getTimeOfCollision(a, b, c);
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
    
    static resolveCircleVsCircleCollision = (circleA, movementBoundingBox, circleB) => {
        const vectorToRect = Vectors.getClosestVectorToRectFromCircle(circleB, movementBoundingBox);
        const distanceToRectangle = Vectors.magnitude(vectorToRect);

        const timeOfCollision = 
            Collisions.isCircleCollidedWithRectangle(distanceToRectangle, circleA.radius) 
                ? Collisions.getTimeOfCircleVsCircleCollision(circleA, circleB)
                : null;
    
        if (timeOfCollision === null) return false;
        
        Collisions.moveBodyToPointOfCollision(circleA, timeOfCollision);
    
        if (circleA.isElastic && circleB.isElastic) {
            const [
                finalVelocityA,
                finalVelocityB,
            ] = Collisions.getCircleVsCircleCollisionVelocities(circleA, circleB);
    
            circleA.setVelocity(finalVelocityA);
            circleB.setVelocity(finalVelocityB);
        }
    
        return true;
    };
    
    static resolveCircleVsRectangleCollision = (circle, movementBoundingBox, rectangle) => {
        const timeOfCollision = 
            Collisions.areRectanglesColliding(movementBoundingBox, rectangle)
                ? Collisions.getTimeOfCircleVsRectangleCollision(circle, rectangle)
                : null;
                        
        if (timeOfCollision === null) return false;
    
        Collisions.moveBodyToPointOfCollision(circle, timeOfCollision);
    
        if (circle.isElastic) { // assume all rectangles are inelastic
            const newVector = Collisions.getElasticCircleVsInelasticRectangleCollisionVelocity(circle, rectangle);
            circle.setVelocity(newVector);
        }
    
        return true;
    };

}