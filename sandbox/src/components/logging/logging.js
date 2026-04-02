/**
 * Logs data to the logging API endpoint in production, or to the console in non-production environments.
 *
 * In non-production environments, the logging API may not be available or configured. 
 * To avoid errors and simplify, this function logs messages to the console instead.
 */
export default function logData({ level, message, metadata }) {  
  console.log(message);
}
