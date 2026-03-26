import { useCallback } from "react";
import { genesysService } from "../../services/genesys-service";

export function useQuickReply() {
  const handleQuickReply = useCallback((event, reply) => {
    event.preventDefault();
    genesysService.sendMessageToGenesys(reply);
  }, []);

  return { handleQuickReply };
}
