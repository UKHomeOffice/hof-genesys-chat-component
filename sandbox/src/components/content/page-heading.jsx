export default function PageHeading({ serviceName, serviceSubText }) {
  return (
    <div className="govuk-main-wrapper">
      <h1 className="govuk-heading-l">Home Office {serviceName} Chat</h1>
      <p className="govuk-body">Ask our digital assistant about {serviceSubText}</p>
      <hr className="govuk-section-break govuk-section-break--visible"></hr>
    </div>
  );
} 
