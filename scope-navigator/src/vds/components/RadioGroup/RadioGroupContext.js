import { createContext } from 'react'

/* ----------------------------------------------------------------------------
   RadioGroupContext — how RadioGroup hands name / selected value / change
   handler / disabled down to its Radio children without prop-drilling or
   cloning. Radio reads it (null when used standalone).
   Shape: { name, value, onSelect(value, event), disabled }
   -------------------------------------------------------------------------- */
export const RadioGroupContext = createContext(null)
