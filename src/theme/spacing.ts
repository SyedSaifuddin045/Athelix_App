export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xl2: 14,
  xl3: 16,
  xl4: 20,
  xl5: 24,
  xl6: 28,
  xl7: 32,
  xl8: 40,
  xl9: 48,
  xl10: 56,
};

export const RADIUS = {
  button: 18,
  card: 24,
  cardSmall: 16,
  input: 14,
  chip: 999,
  iconWrap: 14,
  avatar: 999,
  sheet: 28,
  tag: 999,
  round: 999,
  stepper: 8,
  modal: 20,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  }),
};
