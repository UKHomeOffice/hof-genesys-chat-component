export default function MessageWrapper({ children, isLast, lastMessageRef }) {
  return (
    <div ref={isLast ? lastMessageRef : null}>
      {children}
    </div>    
  );
}
