import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import MessageText from '../../../src/components/message/message-text';

describe('MessageText component', () => {

  // Helper function to get the main paragraph element, if it exists
  const getParagraph = (container) => container.querySelector("p.govuk-body")

  test('renders same message string if no markdown present', () => {
    const { container } = render(<MessageText text='This has no markdown content.' />);
    const paragraph = getParagraph(container);

    expect(paragraph).toBeInTheDocument();

    expect(paragraph).toHaveTextContent('This has no markdown content.');
  });

  test('renders message after removing backslashes', () => {
    const { container } = render(<MessageText text='This has a backslash \\ here.' />);

    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    expect(paragraph).toHaveTextContent('This has a backslash here.');
  });

  test.each([
    'This is a **bold** message.',
    'This is a __bold__ message.'
  ])('renders message containing bold text (%s)', (message) => {
    const { container } = render(<MessageText text={message} />);

    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The word "bold" should be present and wrapped in <strong>
    const boldText = screen.getByText('bold');
    expect(boldText).toBeInTheDocument();
    expect(boldText.closest('strong')).toBeInTheDocument();
    expect(boldText).toBeInTheDocument();

    expect(within(paragraph).getByText('This is a', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('message.', { exact: false })).toBeInTheDocument();
  });

  test('renders message containing italic text', () => {
    const { container } = render(<MessageText text='This is an *italic* message.' />);

    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The word "italic" should be present and wrapped in <em>
    const italicText = screen.getByText('italic');
    expect(italicText).toBeInTheDocument();
    expect(italicText.closest('em')).toBeInTheDocument();
    expect(italicText).toBeInTheDocument();

    expect(within(paragraph).getByText('This is an', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('message.', { exact: false })).toBeInTheDocument();
  });

  test('renders message containing link', () => {
    const { container } = render(<MessageText text='Here is an [example link](https://example.com)' />);
    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The link should be present
    const link = screen.getByText('example link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveAttribute('node');
    expect(link).not.toHaveAttribute('position');
    expect(link).toHaveClass('govuk-link');

    expect(within(paragraph).getByText('Here is an', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('link', { exact: false })).toBeInTheDocument();
  });

  test('renders message containing link with title attribute', () => {
    const { container } = render(<MessageText text='Here is an [example link](https://example.com "Example Title")' />);
    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The link should be present
    const link = screen.getByText('example link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('title', 'Example Title');
    expect(link).not.toHaveAttribute('node');
    expect(link).not.toHaveAttribute('position');
    expect(link).toHaveClass('govuk-link');

    expect(within(paragraph).getByText('Here is an', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('link', { exact: false })).toBeInTheDocument();
  });

  test('renders message containing link with supplied utmParam', () => {
    const { container } = render(<MessageText text='Here is an [example link](https://example.com)' utmParam='?utm_source=chat&utm_medium=web' />);
    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The link should be present
    const link = screen.getByText('example link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com?utm_source=chat&utm_medium=web');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveAttribute('node');
    expect(link).not.toHaveAttribute('position');
    expect(link).toHaveClass('govuk-link');

    expect(within(paragraph).getByText('Here is an', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('link', { exact: false })).toBeInTheDocument();
  });

  test.each([
    'Here is an [example email](mailto:example@example.com)',
    'Here is an [example email](mailto:example@\\example.com)',
    'Here is an [example email](mailto:\\example@\\example.com)',
  ])('renders message containing email address as mailto link (%s)', (linkText) => {
    const { container } = render(<MessageText text={linkText} />);

    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The email should be present
    const link = screen.getByText('example email');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'mailto:example@example.com');
    expect(link).not.toHaveAttribute('node');
    expect(link).not.toHaveAttribute('position');
    expect(link).toHaveClass('govuk-link');
    expect(link).toHaveClass('govuk-link--email');

    expect(within(paragraph).getByText('Here is an', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('email', { exact: false })).toBeInTheDocument();
  });

  test('renders message without backslashes in link text', () => {
    const { container } = render(<MessageText text='Here is an [example link](https://\\example.com)' />);
    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // The link should be present
    const link = screen.getByText('example link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveAttribute('node');
    expect(link).not.toHaveAttribute('position');
    expect(link).toHaveClass('govuk-link');

    expect(within(paragraph).getByText('Here is an', { exact: false })).toBeInTheDocument();
    expect(within(paragraph).getByText('link', { exact: false })).toBeInTheDocument();
  });

  test('renders Inbound message with correct styling', () => {
    const { container } = render(<MessageText text='This has no markdown content.' messageType='Inbound' />);
    const paragraph = getParagraph(container);

    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('This has no markdown content.');

    expect(paragraph).toHaveClass('inbound-message');
    expect(paragraph).toHaveClass('govuk-body');
  });

  test('renders Outbound message with correct styling', () => {
    const { container } = render(<MessageText text='This has no markdown content.' messageType='Outbound' />);
    const paragraph = getParagraph(container);

    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('This has no markdown content.');

    expect(paragraph).toHaveClass('outbound-message');
    expect(paragraph).toHaveClass('govuk-body');
  });

  test('renders inline-only content inside a single paragraph', () => {
    const { container } = render(<MessageText text={'This is **bold** text.'} />);

    const paragraph = getParagraph(container);
    expect(paragraph).toBeInTheDocument();

    // No nested paragraphs
    expect(paragraph.querySelector('p')).toBeNull();

    // Bold is rendered inside the paragraph
    const strong = paragraph.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong).toHaveTextContent('bold');
  });

  test('renders a list without wrapping it in a paragraph', () => {
    const markdownText = '- item 1\n- item 2';
    const { container } = render(<MessageText text={markdownText} />);

    // Paragraph may not exist when content is block-level only
    const paragraph = getParagraph(container);
    expect(paragraph).toBeNull();

    const ul = container.querySelector('ul.govuk-list.govuk-list--bullet');
    expect(ul).toBeInTheDocument();

    const items = ul.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0]).toHaveTextContent('item 1');
    expect(items[1]).toHaveTextContent('item 2');
  });

  test('renders a paragraph followed by a list with valid nesting', () => {
    const markdownText = 'Intro text.\n\n- Item A\n- Item B';
    const { container } = render(<MessageText text={markdownText} messageType="Outbound" />);

    // Root should be a <div> because block-level content exists
    const rootDiv = screen.getByTestId('message-root');
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv.tagName.toLowerCase()).toBe('div');
    expect(rootDiv).toHaveClass('outbound-message'); // messageType styling should apply to the div wrapper, not the p element now
    expect(rootDiv).toHaveClass('govuk-body');

    // First paragraph for inline text
    const firstParagraph = container.querySelector('p.govuk-body');
    expect(firstParagraph).toBeInTheDocument();
    expect(firstParagraph).toHaveTextContent('Intro text.');
    expect(firstParagraph).not.toHaveClass('outbound-message'); // messageType styling should be on the root div, not the p element

    // List appears as a sibling, not inside the paragraph
    const ul = container.querySelector('ul.govuk-list.govuk-list--bullet');
    expect(ul).toBeInTheDocument();
    expect(firstParagraph).not.toContainElement(ul);
  });

  test('handles both inline-only and block-only content gracefully', () => {
    const inline = render(<MessageText text={'Hello **world**'} />);
    expect(inline.container.querySelector('p.govuk-body')).toBeInTheDocument();

    const blockOnly = render(<MessageText text={'- a\n- b'} />);
    expect(blockOnly.container.querySelector('p.govuk-body')).toBeNull();
  });

  test("renders H1 (block-level) without <p>", () => {
    const markdownText = "# Heading Title";
    const { container } = render(<MessageText text={markdownText} />);

    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent("Heading Title");

    expect(getParagraph(container)).toBeNull();
  });

  test("renders mixed heading + paragraph", () => {
    const markdownText = "# Title\n\nSome text";
    const { container } = render(<MessageText text={markdownText} />);

    expect(container.querySelector("h1")).toBeInTheDocument();
    expect(getParagraph(container)).toBeInTheDocument();
  });

  test("bold inside list", () => {
    const markdownText = "- Item with **bold**";
    const { container } = render(<MessageText text={markdownText} />);

    const ul = container.querySelector("ul");
    expect(ul.querySelector("strong")).toHaveTextContent("bold");
  });

  test("italic inside link", () => {
    const markdownText = "[_italic link_](https://example.com)";
    const { container } = render(<MessageText text={markdownText} />);

    const link = container.querySelector("a");
    expect(link.querySelector("em")).toHaveTextContent("italic link");
  });

  test("nested bold+italic", () => {
    const markdownText = "**This _is_ bold**";
    const { container } = render(<MessageText text={markdownText} />);

    const strong = container.querySelector("strong");
    expect(strong).toBeInTheDocument();
    expect(strong.querySelector("em")).toHaveTextContent("is");
  });

  test("script tags are not executed and remain escaped as text", () => {
    const markdownText = "Before <script>alert('hi')</script> After";
    const { container } = render(<MessageText text={markdownText} />);

    // Script elements must NOT appear in the DOM
    expect(container.querySelector("script")).toBeNull();

    // The escaped script tag WILL appear as literal text (correct behaviour)
    expect(container.textContent).toContain("Before <script>alert('hi')</script> After");
  });

  test("raw HTML is escaped, not executed", () => {
    const markdownText = "Example <b>text</b>";
    const { container } = render(<MessageText text={markdownText} />);

    // ReactMarkdown escapes raw HTML because rehype-raw isn't enabled
    const paragraph = container.querySelector("p");
    expect(paragraph).toHaveTextContent("Example <b>text</b>");
    expect(paragraph.querySelector("b")).toBeNull();
  });

  test("renders blockquotes correctly with inner <p> but not wrapped in another <p>", () => {
    const markdownText = "> This is a quote";
    const { container } = render(<MessageText text={markdownText} messageType="Outbound" />);

    const blockquote = container.querySelector("blockquote");
    expect(blockquote).toBeInTheDocument();

    // A paragraph must appear INSIDE the blockquote
    const innerP = blockquote.querySelector("p.govuk-body");
    expect(innerP).toBeInTheDocument();
    expect(innerP).toHaveTextContent("This is a quote");

    // But the blockquote itself must NOT be wrapped in an outer paragraph
    const allPs = container.querySelectorAll("p.govuk-body");
    expect(allPs.length).toBe(1); // exactly one: the inner one
  });

  test("ul renders without <p> wrapper", () => {
    const markdownText = "- One\n- Two";
    const { container } = render(<MessageText text={markdownText} />);
    expect(getParagraph(container)).toBeNull();

    const ul = container.querySelector("ul.govuk-list.govuk-list--bullet");
    expect(ul).toBeInTheDocument();
    expect(ul.querySelectorAll("li").length).toBe(2);
  });

  test("ol renders with GOV.UK number list class", () => {
    const markdownText = "1. First\n2. Second";
    const { container } = render(<MessageText text={markdownText} />);

    const ol = container.querySelector("ol.govuk-list.govuk-list--number");
    expect(ol).toBeInTheDocument();
    expect(ol.querySelector("li")).toHaveTextContent("First");
  });

  test("renders GFM tables correctly without wrapping them in a paragraph", () => {
    const markdownText = `
| Name  | Age |
|-------|-----|
| Alice |  30 |
| Bob   |  40 |
  `.trim();

    const { container } = render(<MessageText text={markdownText} messageType="Outbound" />);
    // 1. Table element should exist
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();

    // 2. Header cells (<th>)
    const headers = table.querySelectorAll("thead th");
    expect(headers.length).toBe(2);
    expect(headers[0]).toHaveTextContent("Name");
    expect(headers[1]).toHaveTextContent("Age");

    // 3. Body cells (<td>)
    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);

    const firstRow = rows[0].querySelectorAll("td");
    const secondRow = rows[1].querySelectorAll("td");

    expect(firstRow[0]).toHaveTextContent("Alice");
    expect(firstRow[1]).toHaveTextContent("30");

    expect(secondRow[0]).toHaveTextContent("Bob");
    expect(secondRow[1]).toHaveTextContent("40");

    // 4. Ensure tables are *not* wrapped in your custom <p>
    const paragraph = container.querySelector("p.outbound-message.govuk-body");
    // For table-only markdown, no paragraph should exist
    expect(paragraph).toBeNull();
  });

  test('renders message text with literal \\n as line breaks and renders list as a sibling block', () => {
    const msg = "Line 1\\nLine 2 with a [link](https://example.com)\\nFinal inline line\\n- First\\n- Second";
    const { container } = render(<MessageText text={msg} messageType="Outbound" />);
    const root = screen.getByTestId('message-root');
    expect(root).toBeInTheDocument();

    const p = root.querySelector('p.govuk-body');
    expect(p).toBeInTheDocument();

    const brs = p.querySelectorAll('br');
    expect(brs.length).toBe(2);

    const a = p.querySelector('a.govuk-link');
    expect(a).toBeInTheDocument();
    expect(a).toHaveAttribute('href', 'https://example.com');

    const ul = root.querySelector('ul.govuk-list.govuk-list--bullet');
    expect(ul).toBeInTheDocument();

    // Make sure the list is not inside the paragraph
    expect(p).not.toContainElement(ul);
  });
});
