import { Vectors } from "./Vectors";

const quadratic = (a, b, c) => {
    return [
        (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
    ];
};

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

    // returns 0 > t > 1, where t is the distance along movement where collision happens
    static getTimeOfCircleOnCircleCollision = (A, B) => {
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

        const roots = quadratic(a, b, c);

        const validRoots = roots.filter(t => t <= 1);

        if (!validRoots.length) {
            return null;
        }
        
        return Math.min(...validRoots);
    }

    static isCircleCollidedWithRectangle = (distanceToRectangle, circleRadius) => {
        return distanceToRectangle <= circleRadius;
    }

    static resolveCircleRectangleCollision = (vectorToRectFromCircle, circle) => {
        const normalizedVectorToRect = Vectors.normalize(vectorToRectFromCircle);
        const distanceToRect = Vectors.magnitude(vectorToRectFromCircle);
        
        const circleRectangleOverlap = circle.radius - distanceToRect;
        const repositionVector = Vectors.mult(normalizedVectorToRect, circleRectangleOverlap);
        
        circle.x += repositionVector.x;
        circle.y += repositionVector.y;
    }
}