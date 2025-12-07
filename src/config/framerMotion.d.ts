import type { Transition } from 'framer-motion';

export interface Variant {
  initial: any;
  animate: any;
  exit: any;
}

export function getTransition(type?: 'default' | 'fast' | 'smooth' | 'bounce'): Transition;

export const fadeInUp: Variant;
export const fadeIn: Variant;
export const scaleIn: Variant;
export const slideInRight: Variant;
export const slideInLeft: Variant;