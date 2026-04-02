import React from 'react';
import ErrorComponent from '../components/error/error-component';
import logData from '../components/logging/logging';

/**
 * A React error boundary component that catches JavaScript errors anywhere in its child component tree,
 * it's designed to be used to wrap each specific web messenger route component (e.g., ETA, EUSS, eVisa).
 * When an error is caught, it logs the error details and displays a user-friendly error message, 
 * containing a link to a contact form for that specific web messenger.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * If the component catches an error, log it with relevant details.
   * The errorInfo.componentStack contains the stack trace of where the error was thrown.
   * So we can use this to identify the root cause of the error, by taking the first line of the stack trace.
   * @param {object} error 
   * @param {object} errorInfo 
   */
  componentDidCatch(error, errorInfo) {    
    const stackLines = errorInfo.componentStack
      .trim()
      .split('\n')
      .map(line => line.trim());
      
    logData({
      level: 'error',
      message: 'Error caught by error boundary handler',
      metadata: {
        error: error.name,
        errorMessage: error.message,
        rootCause: stackLines[0]
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorComponent contactFormLink={this.props.contactFormLink}/>;
    }

    return this.props.children;
  }
}
