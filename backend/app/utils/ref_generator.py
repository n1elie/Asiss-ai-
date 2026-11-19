import random


class RefGenerator:
    @staticmethod
    def generate_quotation_ref() -> str:
        random_digits = random.randint(10000, 99999)
        return f"#QT-{random_digits}"
