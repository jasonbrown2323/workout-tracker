from app.utils.plate_calculator import PlateCalculator

def test_simple_plate_calculation():
    result = PlateCalculator.calculate_plates(225)
    assert result["target_weight"] == 225
    assert result["plates_per_side"] == [45, 45]
    assert result["bar_weight"] == 45

def test_complex_plate_calculation():
    result = PlateCalculator.calculate_plates(185)
    assert result["target_weight"] == 185
    assert result["plates_per_side"] == [45, 25]
    assert result["actual_weight"] == 185

def test_weight_below_bar():
    result = PlateCalculator.calculate_plates(40)
    assert "error" in result
    assert result["bar_weight"] == 45
