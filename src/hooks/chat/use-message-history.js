import { useCallback } from "react";
import { genesysService } from "../../services/genesys-service";

export function useFetchMessageHistory({ setIsErrorState }) {
  const handleFetchMessageHistory = useCallback(() => {
    genesysService.fetchMessageHistory(() => setIsErrorState(true));
  }, [setIsErrorState]);

  return { handleFetchMessageHistory };
}
