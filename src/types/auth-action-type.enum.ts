export const AuthActionType = {
  INITIALIZE: "INITIALIZE",
  SIGN_IN: "SIGN_IN",
  SIGN_OUT: "SIGN_OUT",
} as const;

export type AuthActionType = typeof AuthActionType[keyof typeof AuthActionType];