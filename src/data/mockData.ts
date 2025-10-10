import { User, Appointment, PatientRecord, Service, ServiceCatalogItem } from '../types';
export const mockServicesCatalog: ServiceCatalogItem[] = [
  {
    id: 'sc_1',
    name: 'Routine Cleaning',
    description: 'Comprehensive dental cleaning and oral health examination with plaque and tartar removal',
    base_price: 120,
    estimated_duration: 60,
    buffer_time: 15,
    pricing_model: 'Per Session' as 'Per Session',
    tooth_chart_use: 'not needed' as 'not needed',
    is_active: true
  },
  {
    id: 'sc_2',
    name: 'Dental Filling',
    description: 'Composite or amalgam filling for cavity restoration',
    base_price: 180,
    estimated_duration: 45,
    buffer_time: 15,
    pricing_model: 'Per Tooth' as 'Per Tooth',
    tooth_chart_use: 'required' as 'required',
    is_active: true
  },
  {
    id: 'sc_3',
    name: 'Root Canal Treatment',
    description: 'Endodontic therapy to treat infected or severely decayed teeth',
    base_price: 800,
    estimated_duration: 90,
    buffer_time: 30,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_4',
    name: 'Teeth Whitening',
    description: 'Professional teeth whitening treatment for brighter smile',
    base_price: 350,
    estimated_duration: 75,
    buffer_time: 15,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_5',
    name: 'Tooth Extraction',
    description: 'Surgical or simple removal of damaged or problematic teeth',
    base_price: 250,
    estimated_duration: 30,
    buffer_time: 20,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_6',
    name: 'Dental Crown',
    description: 'Custom-made crown to restore damaged tooth structure and function',
    base_price: 950,
    estimated_duration: 120,
    buffer_time: 30,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_7',
    name: 'Orthodontic Consultation',
    description: 'Initial consultation and assessment for braces or clear aligners',
    base_price: 150,
    estimated_duration: 45,
    buffer_time: 15,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_8',
    name: 'Dental Bridge',
    description: 'Fixed prosthetic device to replace one or more missing teeth',
    base_price: 1200,
    estimated_duration: 150,
    buffer_time: 30,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_9',
    name: 'Periodontal Treatment',
    description: 'Deep cleaning and treatment for gum disease and periodontal issues',
    base_price: 300,
    estimated_duration: 90,
    buffer_time: 20,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  },
  {
    id: 'sc_10',
    name: 'Dental Implant',
    description: 'Permanent tooth replacement with titanium implant and crown',
    base_price: 2500,
    estimated_duration: 180,
    buffer_time: 45,
    is_active: true,
    pricing_model: 'Per Tooth',
    tooth_chart_use: 'required'
  }
];
