// @ts-ignore
import isMobile from "is-mobile";
import { brotliDecompressSync } from "zlib";

const styles = `
  [data-title] {
    position: relative;
  }

  [data-title]:hover::before {
    content: attr(data-title);
    position: absolute;
    background-color: var(--color-text);
    top: 130%;
    left: 50%;
    width: 100%;
    max-width: 300px;
    transform: translatex(-50%);
    padding: 0.5rem;
    border-radius: 0.5rem;
    z-index: 2;
    font-size: 0.875rem;
    font-family: var(--font-sans);
    color: var(--color-bg);
    font-weight: normal;
  }
`;

function registerDesktopStyles() {
  if (!isMobile()) {
    const stylesheet = document.createElement("style");
    stylesheet.textContent = styles;
    document.body.appendChild(stylesheet);
  }
}

export default registerDesktopStyles;
