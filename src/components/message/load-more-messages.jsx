export default function LoadMoreMessagesButton({ onClick }) {
  return (
    <button
      type="button"
      data-testid="load-more-messages-button"
      id="load-more-messages-button"
      className="govuk-button govuk-button--secondary fetch-history-button"
      data-module="govuk-button"
      onClick={onClick}
    >
      Load more messages
    </button>
  );
}
