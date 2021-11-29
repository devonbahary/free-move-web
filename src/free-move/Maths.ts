export class Maths {
    static quadratic = (a: number, b: number, c: number) => {
        const roots = [
            (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
            (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a),
        ];

        return roots.filter(r => !isNaN(r));
    };

    // does the line segment A have overlap with line segment B
    static hasOverlap = (a0: number, a1: number, b0: number, b1: number) => {
        if (b1 < a0) return false;
        if (a1 < b0) return false;
        return true;
    };

    static getExactOverlap = (a0: number, a1: number, b0: number, b1: number) => {
        if (a0 === b1) return a0;
        if (a1 === b0) return a1;
        return null;
    }

    // alleviate floating point errors (e.g., -7.082604849269798e-7 should be 0)
    static roundFloatingPoint = (timeOfCollision: number) => {
        return Math.round(timeOfCollision * 1000) / 1000;
    };
}
