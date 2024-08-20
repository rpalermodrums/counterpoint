import unittest
from fractions import Fraction
from counterpoint_utils import Note, Voice, Species, Mode, calculate_interval, is_consonant, is_perfect_consonance, is_passing_tone, check_parallel_motion, is_in_mode
from counterpoint_rules import check_first_species_rules, check_second_species_rules, check_third_species_rules, check_fourth_species_rules, check_fifth_species_rules

class TestCounterpointUtils(unittest.TestCase):
    def test_calculate_interval(self):
        self.assertEqual(calculate_interval(60, 67), 7)  # Perfect fifth
        self.assertEqual(calculate_interval(60, 64), 4)  # Major third
        self.assertEqual(calculate_interval(60, 72), 0)  # Octave (0 mod 12)

    def test_is_consonant(self):
        self.assertTrue(is_consonant(0))   # Unison
        self.assertTrue(is_consonant(3))   # Minor third
        self.assertTrue(is_consonant(4))   # Major third
        self.assertTrue(is_consonant(7))   # Perfect fifth
        self.assertFalse(is_consonant(2))  # Major second
        self.assertFalse(is_consonant(6))  # Tritone

    def test_is_perfect_consonance(self):
        self.assertTrue(is_perfect_consonance(0))   # Unison
        self.assertTrue(is_perfect_consonance(7))   # Perfect fifth
        self.assertTrue(is_perfect_consonance(12))  # Octave
        self.assertFalse(is_perfect_consonance(4))  # Major third

    def test_is_passing_tone(self):
        self.assertTrue(is_passing_tone(60, 62, 64))   # Ascending
        self.assertTrue(is_passing_tone(64, 62, 60))   # Descending
        self.assertFalse(is_passing_tone(60, 62, 60))  # Not passing

    def test_check_parallel_motion(self):
        self.assertTrue(check_parallel_motion(60, 67, 64, 71))   # Parallel fifths
        self.assertFalse(check_parallel_motion(60, 64, 64, 67))  # Not parallel fifths

    def test_is_in_mode(self):
        self.assertTrue(is_in_mode(60, 60, Mode.IONIAN))   # C in C Ionian
        self.assertTrue(is_in_mode(62, 60, Mode.IONIAN))   # D in C Ionian
        self.assertFalse(is_in_mode(61, 60, Mode.IONIAN))  # C# not in C Ionian

class TestCounterpointRules(unittest.TestCase):
    def test_first_species_rules(self):
        cf = [Note(60, Fraction(1, 1), Fraction(0, 1)), Note(62, Fraction(1, 1), Fraction(1, 1)), Note(64, Fraction(1, 1), Fraction(2, 1))]
        cp_valid = [Note(67, Fraction(1, 1), Fraction(0, 1)), Note(69, Fraction(1, 1), Fraction(1, 1)), Note(72, Fraction(1, 1), Fraction(2, 1))]
        cp_invalid = [Note(67, Fraction(1, 1), Fraction(0, 1)), Note(68, Fraction(1, 1), Fraction(1, 1)), Note(72, Fraction(1, 1), Fraction(2, 1))]

        valid, errors = check_first_species_rules(cp_valid, cf)
        self.assertTrue(valid)
        self.assertEqual(len(errors), 0)

        valid, errors = check_first_species_rules(cp_invalid, cf)
        self.assertFalse(valid)
        self.assertGreater(len(errors), 0)

    # Add similar tests for other species...

if __name__ == '__main__':
    unittest.main()

