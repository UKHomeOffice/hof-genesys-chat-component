import { formatDate } from "../../utils";

export default function MessageMetaData({ type, messageTimeStamp, metaDisplay }) {
  const formattedTimestamp = formatDate(messageTimeStamp);
  return (
    <p className={`${type === 'Inbound' ? 'inbound-meta-data' : 'outbound-meta-data'} govuk-body`}>
      <time dateTime={formattedTimestamp}
        aria-label={`${metaDisplay} at ${formattedTimestamp}`}>
        <span data-testid='message-metadata'>{`${metaDisplay} at ${formattedTimestamp}`}</span>
      </time>
    </p>
  );
}
