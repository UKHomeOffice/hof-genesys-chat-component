export default function ErrorComponent({contactFormLink}) {
  return (
    <div className="error-component">
      <h1 className="govuk-heading-l">Something went wrong</h1>
      <p className="govuk-body">
        Please try again in a few minutes or use our 
        <a data-testid="error-contact-form" className="govuk-link govuk-link--no-visited-state" 
          href={contactFormLink}> contact form</a>. We will reply in 3 to 5 working days.
      </p>
    </div>
  );
}
