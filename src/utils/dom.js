/**
 * A shorthand for document.querySelector
 * @param {string} selector - CSS selector
 * @param {Element|Document} parent - Parent element to query from (defaults to document)
 * @returns {Element|null} The first matching element or null
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * A shorthand for document.querySelectorAll
 * @param {string} selector - CSS selector
 * @param {Element|Document} parent - Parent element to query from (defaults to document)
 * @returns {NodeList} All matching elements
 */
export function qsa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Creates a DOM element with optional properties
 * @param {string} tag - HTML tag name
 * @param {Object} props - Properties to set on the element
 * @param {Node[]} children - Child nodes to append
 * @returns {Element} The created element
 */
export function createElement(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class' || key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}
