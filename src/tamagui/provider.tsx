import { TamaguiProvider, type TamaguiProviderProps } from "@tamagui/core";

import { config } from "./config";

export function TamaguiAppProvider({ children, ...props }: Partial<TamaguiProviderProps>) {
  return (
    <TamaguiProvider config={config} defaultTheme="dark" {...props}>
      {children}
    </TamaguiProvider>
  );
}
