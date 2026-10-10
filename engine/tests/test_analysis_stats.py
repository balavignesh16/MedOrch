import pytest

from engine.analysis.stats import intervals_overlap, wilson_interval


def test_wilson_interval_matches_reference_values() -> None:
    low, high = wilson_interval(10, 20)
    assert low == pytest.approx(0.2993, abs=5e-4)
    assert high == pytest.approx(0.7007, abs=5e-4)

    low, high = wilson_interval(0, 10)
    assert low == pytest.approx(0.0, abs=1e-12)
    assert high == pytest.approx(0.2775, abs=5e-4)

    low, high = wilson_interval(10, 10)
    assert high == pytest.approx(1.0, abs=1e-12)
    assert low == pytest.approx(0.7225, abs=5e-4)


def test_wilson_interval_handles_empty_denominator() -> None:
    assert wilson_interval(0, 0) == (0.0, 0.0)


def test_interval_overlap() -> None:
    assert intervals_overlap((0.1, 0.3), (0.2, 0.4))
    assert intervals_overlap((0.1, 0.3), (0.3, 0.5))
    assert not intervals_overlap((0.1, 0.2), (0.3, 0.4))
