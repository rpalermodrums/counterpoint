export class Fraction {
  constructor(
    public readonly numerator: number,
    public readonly denominator: number = 1
  ) {
    if (denominator === 0) throw new Error("Denominator cannot be zero");
    const gcd = this.gcd(Math.abs(numerator), Math.abs(denominator));
    this.numerator = numerator / gcd;
    this.denominator = denominator / gcd;
    if (this.denominator < 0) {
      this.numerator = -this.numerator;
      this.denominator = -this.denominator;
    }
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  subtract(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  multiply(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.numerator,
      this.denominator * other.denominator
    );
  }

  divide(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator,
      this.denominator * other.numerator
    );
  }

  equals(other: Fraction): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator;
  }

  lessThan(other: Fraction): boolean {
    return this.numerator * other.denominator < other.numerator * this.denominator;
  }

  lessThanOrEqual(other: Fraction): boolean {
    return this.lessThan(other) || this.equals(other);
  }

  greaterThan(other: Fraction): boolean {
    return !this.lessThanOrEqual(other);
  }

  toNumber(): number {
    return this.numerator / this.denominator;
  }

  toString(): string {
    return this.denominator === 1 ? `${this.numerator}` : `${this.numerator}/${this.denominator}`;
  }

  static from(n: number, d: number = 1): Fraction {
    return new Fraction(n, d);
  }

  static ZERO = new Fraction(0, 1);
  static ONE = new Fraction(1, 1);
  static HALF = new Fraction(1, 2);
  static QUARTER = new Fraction(1, 4);
}
