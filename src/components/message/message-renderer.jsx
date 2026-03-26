import { classifyMessage } from "./classifiers";
import { MESSAGE_REGISTRY } from "./message-registry";

export function MessageRenderer(props) {
  const type = classifyMessage(props.message);
  const Component = MESSAGE_REGISTRY[type];

  if (!Component) {
    return null;
  }

  return <Component {...props} />;
}
