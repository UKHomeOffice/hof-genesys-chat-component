import LoadingSpinner from '@hods/loading-spinner';
import { GenesysChatComponent } from 'hof-genesys-chat-component';
import ErrorComponent from '../components/error/error-component';
import { useNavigate } from 'react-router';
import logData from '../components/logging/logging';
import PageHeading from '../components/content/page-heading';
import appConfig from '../../config';

export default function Sandbox() {

  let navigate = useNavigate();

  return (
    <>
      <PageHeading serviceName={appConfig.sandbox.serviceName} serviceSubText={appConfig.sandbox.serviceSubText} />
      <GenesysChatComponent
        genesysEnvironment={import.meta.env.VITE_GENESYS_ENVIRONMENT}
        deploymentId={import.meta.env.VITE_SANDBOX_DEPLOYMENT_ID}
        serviceMetadata={{
          localStorageKey: appConfig.sandbox.localStorageKey,
          serviceName: appConfig.sandbox.serviceName,
          agentConnectedText: appConfig.bannerTypeDisplay.human,
          agentDisconnectedText: appConfig.bannerTypeDisplay.agentDisconnected,
          offlineText: appConfig.bannerTypeDisplay.offline,
          onlineText: appConfig.bannerTypeDisplay.online,
          botMetaDisplay: appConfig.sandbox.botMetaDisplay,
        }}
        onChatEnded={() => navigate("/end-chat-confirmation")}
        loggingCallback={logData}
        loadingSpinner={<LoadingSpinner />}
        errorComponent={<ErrorComponent contactFormLink={appConfig.sandbox.errorContactLink}/>}
      />
    </>
  );
}
