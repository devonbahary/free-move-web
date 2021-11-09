export class Maths {
    // returns real and imaginary roots
    static quadratic = (a, b, c) => {
        return [
            (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
            (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        ];
    };

    // does the line segment A have overlap with line segment B
    static hasOverlap = (a0, a1, b0, b1) => {
        if (b1 < a0) return false;
        if (a1 < b0) return false;
        return true;
    };

    // alleviate floating point errors (e.g., -7.082604849269798e-7 should be 0)
    static roundFloatingPoint = (timeOfCollision) => {
        return Math.round(timeOfCollision * 1000) / 1000;
    };
}
