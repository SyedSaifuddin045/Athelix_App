import React from "react";
import { useFocusEffect } from "@react-navigation/native";

type RefetchFn = () => Promise<unknown>;

export function useRefetchOnFocus(refetchers: RefetchFn[]): void {
  const refetchersRef = React.useRef(refetchers);
  refetchersRef.current = refetchers;

  useFocusEffect(
    React.useCallback(() => {
      refetchersRef.current.forEach((refetch) => {
        void refetch();
      });
    }, []),
  );
}
