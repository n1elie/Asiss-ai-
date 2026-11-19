export type ProductType = 'MOTOR' | 'FIRE' | 'TRAVEL' | 'PERSONAL_ACCIDENT';
export type MessageRole = 'assistant' | 'user';
export type MessageType = 'text' | 'product_selection';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETE' | 'SAVED';
export type ConversationStep = 'GREETING' | 'PRODUCT_SELECTION' | 'CAPTURE_DETAILS' | 'REVIEW_RISKS' | 'QUOTATION';

export interface InsuranceProduct {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  timestamp: string;
}

export interface InsuredParty {
  full_name?: string;
  id_registration?: string;
  contact_number?: string;
}

export interface RiskInformation {
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_value?: string;
  property_type?: string;
  property_location?: string;
  property_value?: string;
  destination?: string;
  travel_dates?: string;
  num_travelers?: string;
  occupation?: string;
  age?: string;
  coverage_amount?: string;
}

export interface QuotationSession {
  session_id: string;
  agent_id: string;
  status: SessionStatus;
  quotation_ref: string;
  time_started: string;
  current_step: ConversationStep;
  step_number: number;
  selected_product?: string;
  selected_product_name?: string;
  insured_party: InsuredParty;
  risk_information: RiskInformation;
  messages: ChatMessage[];
  quotation_amount?: string;
  language: string;
}
