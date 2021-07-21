import { Vectors } from "./Vectors";

export class Collisions {
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