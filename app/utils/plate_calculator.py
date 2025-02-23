from typing import Dict, List

class PlateCalculator:
    BAR_WEIGHT = 45  # Standard Olympic bar weight
    AVAILABLE_PLATES = [45, 35, 25, 10, 5, 2.5]  # Standard plate weights

    @staticmethod
    def calculate_plates(target_weight: float) -> Dict:
        if target_weight < PlateCalculator.BAR_WEIGHT:
            return {
                "error": "Weight is less than bar weight",
                "bar_weight": PlateCalculator.BAR_WEIGHT
            }

        weight_per_side = (target_weight - PlateCalculator.BAR_WEIGHT) / 2
        plates_needed = []
        remaining_weight = weight_per_side

        for plate in PlateCalculator.AVAILABLE_PLATES:
            while remaining_weight >= plate:
                plates_needed.append(plate)
                remaining_weight -= plate

        actual_weight = (sum(plates_needed) * 2) + PlateCalculator.BAR_WEIGHT

        return {
            "target_weight": target_weight,
            "bar_weight": PlateCalculator.BAR_WEIGHT,
            "weight_per_side": weight_per_side,
            "plates_per_side": plates_needed,
            "actual_weight": actual_weight
        }
