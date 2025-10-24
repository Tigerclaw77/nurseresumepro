// src/constants/signoffToneOptions.js

export const SIGNOFF_MAP = {
  default: "Sincerely,",
  professional: "Best regards,",
  formal: "Respectfully,",
  friendly: "Warm regards,",
  grateful: "With gratitude,",
  none: "",
};

// Optional tooltip text (if you want more than just the actual signoff string)
export const SIGNOFF_TOOLTIPS = {
  default: "A classic and universally appropriate sign-off.",
  professional: "Polished and neutral — fits most professional settings.",
  formal: "Respectful and hierarchical — good for academic or legal roles.",
  friendly: "Warm and approachable without being unprofessional.",
  grateful: "Expresses thanks — best when appreciation is important.",
  none: "No sign-off will be added to the letter.",
};
