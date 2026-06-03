const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const confirmCloseIconSvg = `
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
  </svg>
`;

export const confirmCheckIconSvg = `
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

export interface WatermarkPatternSvgOptions {
  text: string;
  angle: number;
  size: number;
  density: number;
  color: string;
  opacity: number;
}

export const buildWatermarkPatternSvg = (
  options: WatermarkPatternSvgOptions,
) => {
  const { angle, size, density, color, opacity } = options;
  const text = escapeXml(options.text);

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${density}" height="${density}">` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"` +
    ` fill="${color}" fill-opacity="${opacity}" font-size="${size}"` +
    ` transform="rotate(${angle} ${density / 2} ${density / 2})">${text}</text>` +
    `</svg>`
  );
};

export interface ForeignObjectSvgOptions {
  width: number;
  height: number;
  scale: number;
  html: string;
  backgroundColor: string;
}

export const buildForeignObjectSvg = (options: ForeignObjectSvgOptions) => {
  const { width, height, scale, html, backgroundColor } = options;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}">` +
    `<foreignObject x="0" y="0" width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width: ${width}px; height: ${height}px; transform: scale(${scale}); transform-origin: top left; background-color: ${backgroundColor}; margin: 0; padding: 0;">` +
    html +
    `</div>` +
    `</foreignObject>` +
    `</svg>`
  );
};
