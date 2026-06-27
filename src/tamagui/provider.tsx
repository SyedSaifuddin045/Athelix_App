import { TamaguiProvider, type TamaguiProviderProps } from "@tamagui/core";

import { tamaguiConfig } from "./config";

export function TamaguiAppProvider({ children, ...props }: Partial<TamaguiProviderProps>) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark" {...props}>
      {children}
    </TamaguiProvider>
  );
}
