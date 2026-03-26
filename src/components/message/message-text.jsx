import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';


/**
 * Custom renderer for all Markdown <a> elements.
 * Applies GOV.UK link classes, adds target/rel attributes,
 * and appends UTM parameters for non-mailto links.
 *
 * @param {object} props
 * @param {string} props.href - The hyperlink reference from markdown.
 * @param {Array<React.ReactNode>} props.children - Link text content.
 * @param {string} [props.utmParam] - UTM parameters to append.
 * @returns {JSX.Element} - The rendered anchor tag.
 */
function renderGovUkLink({ node, position, href = '', children, utmParam, ...rest }) {
  const isEmail = href.startsWith('mailto:');

  // Append UTM only if non-mailto
  const finalHref = !isEmail && utmParam ? `${href}${utmParam}` : href;

  const className = `govuk-link${isEmail ? ' govuk-link--email' : ''}`;
  const externalProps = isEmail
    ? {}
    : { target: '_blank', rel: 'noopener noreferrer' };

  return (
    <a {...rest} href={finalHref} className={className} {...externalProps}>
      {children}
    </a>
  );
}

/**
 * Renders a paragraph with appropriate styling. If the paragraph is already wrapped in a message div (isWrapped),
 * it will only apply the GOV.UK body class to the <p> element. 
 * If not wrapped, it will wrap the content in a div with message styling.
 * 
 * @param {Object} children - Children nodes of the paragraph, passed by ReactMarkdown
 * @param {string} messageType - 'Inbound' or 'Outbound' to determine styling
 * @param {boolean} isWrapped - Whether this paragraph is already wrapped in a message div 
 * @returns 
 */
function renderParagraph({ children }, messageType, isWrapped) {
  if (isWrapped) {
    return <p className="govuk-body">{children}</p>;
  }

  return (
    <p className={`${(messageType === 'Inbound') ? 'inbound-message' : 'outbound-message'} govuk-body`}>
      {children}
    </p>
  );
}

function renderUnorderedList({ children }) {
  return (
    <ul className="govuk-list govuk-list--bullet">
      {children}
    </ul>
  );
}

function renderOrderedList({ children }) {
  return (
    <ol className="govuk-list govuk-list--number">
      {children}
    </ol>
  );
}

// Detect if the markdown string contains any block-level constructs
function hasBlockMarkdown(markdown) {
  if (!markdown) {
    return false;
  }
  // Headings: #, ##, ...
  const heading = /(^|\r?\n)\s*#{1,6}\s+\S/;
  // Unordered list: -, *, +
  const ul = /(^|\r?\n)\s*[-*+]\s+\S/;
  // Ordered list: 1. 2. ...
  const ol = /(^|\r?\n)\s*\d+\.\s+\S/;
  // Blockquote: > …
  const blockquote = /(^|\r?\n)\s*>\s+\S/;
  // Fenced code block: ``` or ~~~
  const fenced = /(^|\r?\n)\s*(?:```|~~~)/;
  // GFM table (rough heuristic): a header row with pipes followed by a separator row
  const table = /(^|\r?\n)\s*\|.+\|\s*(\n|\r\n)\s*\|?[\s:-]+\|[\s|:-]*$/m;

  return (
    heading.test(markdown) ||
    ul.test(markdown) ||
    ol.test(markdown) ||
    blockquote.test(markdown) ||
    fenced.test(markdown) ||
    table.test(markdown)
  );
}

/**
 * Function to render message text with markdown support and GOV.UK styling.
 * Uses ReactMarkdown with custom renderers for links, paragraphs and lists.
 * 
 * @param {string} text - the message text coming from Genesys, which may contain markdown
 * @param {string} type - 'Inbound' or 'Outbound' to determine styling
 * @param {string} utmParam - UTM parameters to append to non-mailto links 
 * @returns 
 */
export default function MessageText({ text, type, utmParam }) {
  // Remove all backslashes + normalize literal "\n" to newline before parsing
  const cleanedText = (text || '')
    .replace(/\\n/g, '\n')   // literal backslash+n -> real newline
    .replace(/\\/g, '');     // remove remaining backslashes

  // Check if cleaned text contains block - level elements
  const hasBlocks = hasBlockMarkdown(cleanedText)

  const renderedMarkdown = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        a: (props) => renderGovUkLink({ ...props, utmParam }),
        p: (children) => renderParagraph(children, type, hasBlocks),
        ul: (children) => renderUnorderedList(children),
        ol: (children) => renderOrderedList(children),
      }}
    >
      {cleanedText || ''}
    </ReactMarkdown>
  )

  // If no blocks: return the markdown as-is (ReactMarkdown already wrapped in <p>)
  if (!hasBlocks) {
    return renderedMarkdown;
  }

  // If block-level content exists: wrap everything in a <div> with message classes
  return (
    <div data-testid="message-root"
      className={`${type === "Inbound"
        ? "inbound-message"
        : "outbound-message"
        } govuk-body`}
    >
      {renderedMarkdown}
    </div>
  );

}
