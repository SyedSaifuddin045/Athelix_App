import { Platform } from "react-native";

export const CLERK_SSO_REDIRECT_URL = Platform.OS === "web" ? undefined : "athelix://sso-callback";
