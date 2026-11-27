import { CategoryKey, SizeKey } from "@/lib/types";

export type WizardData = {
  category: CategoryKey | null;
  subCategory: string | null;
  timeSlots: string[];
  address: string;
  latitude: number | null;
  longitude: number | null;
  placement: string;
  floor: string;
  doorCode: string;
  fitsInElevator: boolean;
  canHelpCarry: boolean;
  title: string;
  description: string;
  size: SizeKey;
  price: number;
};

export const INITIAL_WIZARD_DATA: WizardData = {
  category: null,
  subCategory: null,
  timeSlots: [],
  address: "",
  latitude: null,
  longitude: null,
  placement: "In the home",
  floor: "",
  doorCode: "",
  fitsInElevator: false,
  canHelpCarry: false,
  title: "",
  description: "",
  size: "M",
  price: 100,
};

export const STEPS = [
  "category",
  "subCategory",
  "time-slots",
  "address",
  "location-details",
  "details",
  "prohibited",
  "price",
  "publish",
] as const;

export type Step = (typeof STEPS)[number];
