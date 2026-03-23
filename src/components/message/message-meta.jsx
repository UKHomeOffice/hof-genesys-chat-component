export default function MessageMetaData({ metaDataType, messageTimeStamp, metaDisplay }) {
  return (
    <p className={`${metaDataType === 'Inbound' ? 'inbound-meta-data' : 'outbound-meta-data'} govuk-body`}>
      <time dateTime={messageTimeStamp}
        aria-label={`${metaDisplay} at ${messageTimeStamp}`}>
        <span>{`${metaDisplay} at ${messageTimeStamp}`}</span>
      </time>
    </p>
  );
}
