import random
from typing import Any, Dict, Optional, Tuple

from app.models.session import ConversationStep, QuotationSession, SessionStatus
from app.services.product_service import ProductService

SUPPORTED_LANGUAGES = ("English", "French")

PRODUCT_NAMES = {
    "English": {
        "motor": "Motor Insurance",
        "fire": "Fire Insurance",
        "travel": "Travel Insurance",
        "personal_accident": "Personal Accident",
    },
    "French": {
        "motor": "Assurance Auto",
        "fire": "Assurance Incendie",
        "travel": "Assurance Voyage",
        "personal_accident": "Accident Personnel",
    },
}

MESSAGES: Dict[str, Dict[str, str]] = {
    "greeting": {
        "English": (
            "Hello! Welcome to your insurance assistant. I can help you find the right "
            "insurance product and prepare a quotation.\n\n"
            "**Which type of insurance would you like a quotation for?**"
        ),
        "French": (
            "Bonjour ! Bienvenue dans votre assistant d'assurance. Je peux vous aider à "
            "trouver le bon produit d'assurance et à préparer un devis.\n\n"
            "**Pour quel type d'assurance souhaitez-vous un devis ?**"
        ),
    },
    "product_selected": {
        "English": (
            "Great choice! You've selected **{product}**. Let's get started with some details.\n\n"
            "What is the **full name** of the insured party?"
        ),
        "French": (
            "Excellent choix ! Vous avez sélectionné **{product}**. Commençons par quelques détails.\n\n"
            "Quel est le **nom complet** de l'assuré ?"
        ),
    },
    "invalid_product": {
        "English": "I didn't catch that. Please select one of the insurance products shown above.",
        "French": "Je n'ai pas compris. Veuillez sélectionner l'un des produits d'assurance affichés ci-dessus.",
    },
    "ask_id": {
        "English": "Thank you **{name}**! What is your **ID or registration number**?",
        "French": "Merci **{name}** ! Quel est votre **numéro d'identification ou d'immatriculation** ?",
    },
    "ask_contact": {
        "English": "Got it! And what is your **contact number**?",
        "French": "Très bien ! Et quel est votre **numéro de contact** ?",
    },
    "risk_intro": {
        "English": "Perfect! Now let's review the risk information.\n\n{question}",
        "French": "Parfait ! Passons maintenant aux informations de risque.\n\n{question}",
    },
    "all_details_captured": {
        "English": "All details captured! Let's review the risks.\n\n{question}",
        "French": "Tous les détails sont saisis ! Évaluons maintenant les risques.\n\n{question}",
    },
    "quotation_ready": {
        "English": (
            "✅ **Quotation Ready!**\n\n"
            "Based on the information provided, here is your insurance quotation:\n\n"
            "**Product**: {product}\n"
            "**Reference**: {ref}\n"
            "**Annual Premium**: **{amount}**\n\n"
            "You can save this quotation using the **Save Progress** button. "
            "Would you like any adjustments?"
        ),
        "French": (
            "✅ **Devis prêt !**\n\n"
            "D'après les informations fournies, voici votre devis d'assurance :\n\n"
            "**Produit** : {product}\n"
            "**Référence** : {ref}\n"
            "**Prime annuelle** : **{amount}**\n\n"
            "Vous pouvez enregistrer ce devis avec le bouton **Enregistrer la progression**. "
            "Souhaitez-vous des ajustements ?"
        ),
    },
    "already_quoted": {
        "English": "Your quotation has been prepared. You can save your progress using the button on the right.",
        "French": "Votre devis a été préparé. Vous pouvez enregistrer votre progression à l'aide du bouton à droite.",
    },
    "fallback": {
        "English": "I'm here to help. Please select an insurance product to get started.",
        "French": "Je suis là pour vous aider. Veuillez sélectionner un produit d'assurance pour commencer.",
    },
    "default_risk_question": {
        "English": "Please provide the risk details.",
        "French": "Veuillez fournir les détails du risque.",
    },
}

RISK_QUESTIONS: Dict[str, Dict[str, Dict[str, str]]] = {
    "motor": {
        "initial": {
            "English": "What is the **vehicle make and model**? (e.g., Toyota Corolla)",
            "French": "Quelle est la **marque et le modèle du véhicule** ? (ex. Toyota Corolla)",
        },
        "year": {
            "English": "What **year** was the vehicle manufactured?",
            "French": "En quelle **année** le véhicule a-t-il été fabriqué ?",
        },
        "value": {
            "English": "What is the **estimated value** of the vehicle (in USD)?",
            "French": "Quelle est la **valeur estimée** du véhicule (en USD) ?",
        },
    },
    "fire": {
        "initial": {
            "English": "What is the **type of property**? (e.g., Residential, Commercial)",
            "French": "Quel est le **type de bien** ? (ex. Résidentiel, Commercial)",
        },
        "location": {
            "English": "Where is the **property located**?",
            "French": "Où se situe le **bien** ?",
        },
        "value": {
            "English": "What is the **estimated value** of the property (in USD)?",
            "French": "Quelle est la **valeur estimée** du bien (en USD) ?",
        },
    },
    "travel": {
        "initial": {
            "English": "What is your **travel destination**?",
            "French": "Quelle est votre **destination de voyage** ?",
        },
        "dates": {
            "English": "What are your **travel dates**? (e.g., Dec 1 - Dec 15)",
            "French": "Quelles sont vos **dates de voyage** ? (ex. 1 déc. - 15 déc.)",
        },
        "travelers": {
            "English": "How many **travelers** will be covered?",
            "French": "Combien de **voyageurs** seront couverts ?",
        },
    },
    "personal_accident": {
        "initial": {
            "English": "What is the **occupation** of the insured person?",
            "French": "Quelle est la **profession** de la personne assurée ?",
        },
        "age": {
            "English": "What is the **age** of the insured person?",
            "French": "Quel est l'**âge** de la personne assurée ?",
        },
        "coverage": {
            "English": "What **coverage amount** are you looking for? (e.g., $50,000)",
            "French": "Quel **montant de couverture** recherchez-vous ? (ex. 50 000 $)",
        },
    },
}

PRODUCT_KEYWORDS = (
    (("motor", "car", "vehicle", "auto", "voiture", "véhicule", "vehicule"), "motor"),
    (("fire", "property", "incendie", "maison", "habitation"), "fire"),
    (("travel", "trip", "voyage", "vacances"), "travel"),
    (("personal", "accident", "personnel", "personne"), "personal_accident"),
)


def normalize_language(language: Optional[str]) -> str:
    if not language:
        return "English"
    value = language.strip().lower()
    if value in ("fr", "french", "français", "francais"):
        return "French"
    return "English"


class AIOrchestrator:
    def __init__(self, product_service: ProductService) -> None:
        self._product_service = product_service

    def _t(self, language: Optional[str], key: str, **kwargs: Any) -> str:
        template = MESSAGES[key][normalize_language(language)]
        return template.format(**kwargs)

    def _risk_question(self, product_id: Optional[str], question: str, language: Optional[str]) -> str:
        try:
            return RISK_QUESTIONS[product_id or ""][question][normalize_language(language)]
        except KeyError:
            return self._t(language, "default_risk_question")

    def _detect_product(self, message: str) -> Optional[str]:
        value = message.lower()
        for keywords, product_id in PRODUCT_KEYWORDS:
            if any(keyword in value for keyword in keywords):
                return product_id
        return None

    def get_greeting_message(self, language: str = "English") -> Tuple[str, str]:
        return (self._t(language, "greeting"), "product_selection")

    def _next_risk_key(self, session: QuotationSession) -> str:
        risk = session.risk_information
        product_id = session.selected_product
        if product_id == "motor":
            if not risk.vehicle_make:
                return "initial"
            if not risk.vehicle_year:
                return "year"
            return "value"
        if product_id == "fire":
            if not risk.property_type:
                return "initial"
            if not risk.property_location:
                return "location"
            return "value"
        if product_id == "travel":
            if not risk.destination:
                return "initial"
            if not risk.travel_dates:
                return "dates"
            return "travelers"
        if product_id == "personal_accident":
            if not risk.occupation:
                return "initial"
            if not risk.age:
                return "age"
            return "coverage"
        return "initial"

    def current_prompt(self, session: QuotationSession) -> str:
        """Reproduce the question the assistant is currently waiting on.

        Used when the language changes so the pending prompt immediately
        switches language without losing the conversation context.
        """
        language = normalize_language(session.language)
        product_name = PRODUCT_NAMES[language].get(
            session.selected_product or "", session.selected_product_name or ""
        )

        if session.current_step in (
            ConversationStep.GREETING,
            ConversationStep.PRODUCT_SELECTION,
        ):
            return self._t(language, "greeting")

        if session.current_step == ConversationStep.CAPTURE_DETAILS:
            party = session.insured_party
            if not party.full_name:
                return self._t(language, "product_selected", product=product_name)
            if not party.id_registration:
                return self._t(language, "ask_id", name=party.full_name or "")
            return self._t(language, "ask_contact")

        if session.current_step == ConversationStep.REVIEW_RISKS:
            key = self._next_risk_key(session)
            return self._risk_question(session.selected_product, key, language)

        if session.current_step == ConversationStep.QUOTATION:
            return self._t(
                language,
                "quotation_ready",
                product=product_name,
                ref=session.quotation_ref,
                amount=session.quotation_amount or "",
            )

        return self._t(language, "fallback")

    def process_user_message(
        self, session: QuotationSession, user_message: str
    ) -> Tuple[str, Dict[str, Any]]:
        step = session.current_step

        if step in (ConversationStep.GREETING, ConversationStep.PRODUCT_SELECTION):
            return self._handle_product_selection(session, user_message)
        if step == ConversationStep.CAPTURE_DETAILS:
            return self._handle_capture_details(session, user_message)
        if step == ConversationStep.REVIEW_RISKS:
            return self._handle_review_risks(session, user_message)
        if step == ConversationStep.QUOTATION:
            return (self._t(session.language, "already_quoted"), {})
        return (self._t(session.language, "fallback"), {})

    def _handle_product_selection(
        self, session: QuotationSession, user_message: str
    ) -> Tuple[str, Dict[str, Any]]:
        product_id = self._detect_product(user_message)
        if not product_id:
            return (self._t(session.language, "invalid_product"), {})

        language = normalize_language(session.language)
        product_name = PRODUCT_NAMES[language][product_id]
        response = self._t(language, "product_selected", product=product_name)
        updates: Dict[str, Any] = {
            "selected_product": product_id,
            "selected_product_name": product_name,
            "current_step": ConversationStep.CAPTURE_DETAILS,
            "step_number": 2,
        }
        return (response, updates)

    def _handle_capture_details(
        self, session: QuotationSession, user_message: str
    ) -> Tuple[str, Dict[str, Any]]:
        party = session.insured_party
        updates: Dict[str, Any] = {}

        if not party.full_name:
            updates["insured_party"] = {**party.model_dump(), "full_name": user_message.strip()}
            response = self._t(session.language, "ask_id", name=user_message.strip())
        elif not party.id_registration:
            updates["insured_party"] = {
                **party.model_dump(),
                "id_registration": user_message.strip(),
            }
            response = self._t(session.language, "ask_contact")
        elif not party.contact_number:
            updates["insured_party"] = {
                **party.model_dump(),
                "contact_number": user_message.strip(),
            }
            question = self._risk_question(session.selected_product, "initial", session.language)
            updates["current_step"] = ConversationStep.REVIEW_RISKS
            updates["step_number"] = 3
            response = self._t(session.language, "risk_intro", question=question)
        else:
            question = self._risk_question(session.selected_product, "initial", session.language)
            updates["current_step"] = ConversationStep.REVIEW_RISKS
            updates["step_number"] = 3
            response = self._t(session.language, "all_details_captured", question=question)

        return (response, updates)

    def _handle_review_risks(
        self, session: QuotationSession, user_message: str
    ) -> Tuple[str, Dict[str, Any]]:
        risk = session.risk_information
        product_id = session.selected_product
        language = session.language
        updates: Dict[str, Any] = {}

        if product_id == "motor":
            if not risk.vehicle_make:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "vehicle_make": user_message.strip(),
                }
                response = self._risk_question("motor", "year", language)
            elif not risk.vehicle_year:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "vehicle_year": user_message.strip(),
                }
                response = self._risk_question("motor", "value", language)
            elif not risk.vehicle_value:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "vehicle_value": user_message.strip(),
                }
                response, updates = self._finalize_quotation(session, updates)
            else:
                response, updates = self._finalize_quotation(session, updates)

        elif product_id == "fire":
            if not risk.property_type:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "property_type": user_message.strip(),
                }
                response = self._risk_question("fire", "location", language)
            elif not risk.property_location:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "property_location": user_message.strip(),
                }
                response = self._risk_question("fire", "value", language)
            elif not risk.property_value:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "property_value": user_message.strip(),
                }
                response, updates = self._finalize_quotation(session, updates)
            else:
                response, updates = self._finalize_quotation(session, updates)

        elif product_id == "travel":
            if not risk.destination:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "destination": user_message.strip(),
                }
                response = self._risk_question("travel", "dates", language)
            elif not risk.travel_dates:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "travel_dates": user_message.strip(),
                }
                response = self._risk_question("travel", "travelers", language)
            elif not risk.num_travelers:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "num_travelers": user_message.strip(),
                }
                response, updates = self._finalize_quotation(session, updates)
            else:
                response, updates = self._finalize_quotation(session, updates)

        elif product_id == "personal_accident":
            if not risk.occupation:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "occupation": user_message.strip(),
                }
                response = self._risk_question("personal_accident", "age", language)
            elif not risk.age:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "age": user_message.strip(),
                }
                response = self._risk_question("personal_accident", "coverage", language)
            elif not risk.coverage_amount:
                updates["risk_information"] = {
                    **risk.model_dump(),
                    "coverage_amount": user_message.strip(),
                }
                response, updates = self._finalize_quotation(session, updates)
            else:
                response, updates = self._finalize_quotation(session, updates)
        else:
            response, updates = self._finalize_quotation(session, updates)

        return (response, updates)

    def _finalize_quotation(
        self, session: QuotationSession, existing_updates: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        premium_map = {
            "motor": (300, 800),
            "fire": (200, 600),
            "travel": (50, 200),
            "personal_accident": (100, 400),
        }
        lo, hi = premium_map.get(session.selected_product or "", (200, 500))
        amount = random.randint(lo, hi)
        quotation_amount = f"${amount:,}/year"
        language = normalize_language(session.language)
        product_name = PRODUCT_NAMES[language].get(
            session.selected_product or "", session.selected_product_name or ""
        )
        response = self._t(
            language,
            "quotation_ready",
            product=product_name,
            ref=session.quotation_ref,
            amount=quotation_amount,
        )
        updates = {
            **existing_updates,
            "status": SessionStatus.COMPLETE,
            "current_step": ConversationStep.QUOTATION,
            "step_number": 4,
            "quotation_amount": quotation_amount,
        }
        return (response, updates)
