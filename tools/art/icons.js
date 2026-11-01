/* URUKQI line icons (24×24, stroke). Original paths, shared by the page builder
   (inline SVG) and the art renderer (glowing sector emblems). */
(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  else root.URUKQI_ICONS = data;
})(typeof self !== "undefined" ? self : this, function () {
  return {
    // sectors
    retail: "M3 9l1.6-5h14.8L21 9M4 10v10h16V10M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9.5 20v-6h5v6",
    distribution: "M2 6h12v11H2zM14 10h4l4 4v3h-8zM6.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    business: "M4 21V4h10v17M14 9h6v12M2 21h20M7.5 8h3M7.5 12h3M7.5 16h3M17 13v.01M17 17v.01",
    ecommerce: "M2 3h3l2.5 12h11L21 7H6M9.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    restaurants: "M7 2v8M4 2v5a3 3 0 0 0 6 0V2M7 10v12M18 2c-2.2 1.2-3 4-3 7v4h3M18 2v20",
    services: "M15 6a4 4 0 0 0-5.3 5.3L3 18l3 3 6.7-6.7A4 4 0 0 0 18 9l-2.6 2.6L12.4 8.6z",
    contracting: "M3 18h18v3H3zM5 18v-3a7 7 0 0 1 14 0v3M10 8.4V5h4v3.4M9.5 18v-5M14.5 18v-5",
    "real-estate": "M3 11l9-8 9 8M5 9.5V21h14V9.5M9.5 21v-7h5v7",
    healthcare: "M12 3l8 3v6c0 5-3.4 8-8 9.5C7.4 20 4 17 4 12V6zM12 8v7M8.5 11.5h7",
    education: "M12 4L1.5 9.5 12 15l10.5-5.5zM5.5 12v5c3.8 2.6 9.2 2.6 13 0v-5M22.5 9.5V16",
    hospitality: "M2 20V6M2 16h20v4M22 16v-3a3 3 0 0 0-3-3h-9v6M6 12.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z",
    automotive: "M4 16l1.6-6A2.5 2.5 0 0 1 8 8h8a2.5 2.5 0 0 1 2.4 2l1.6 6M3 16h18v4h-3v-1.5H6V20H3zM7 13.5v.01M17 13.5v.01",
    "car-rental": "M15 3a6 6 0 0 0-5.8 7.4L2 17.6V22h4.4v-2.4h2.4v-2.4h2.4l1.4-1.4A6 6 0 1 0 15 3zM16.5 7.5v.01",
    salons: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.2 7.8L20 19M8.2 16.2L20 5",
    gyms: "M2 12h2M20 12h2M6 7v10M4 9v6M18 7v10M20 9v6M6 12h12",
    legal: "M12 3v18M6 21h12M4 7h16M7 7l-3.5 7a3.6 3.6 0 0 0 7 0zM17 7l-3.5 7a3.6 3.6 0 0 0 7 0z",
    fuel: "M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M2.5 21h13M4 11h10M14 13h2a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 0 3 0V9l-3-3",
    warehouses: "M2 21V9l10-6 10 6v12M6 21v-9h12v9M6 15h12M6 18h12",
    logistics: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    manufacturing: "M2 21V10l6 4v-4l6 4V4h6l2 17zM6 18h2M11 18h2M16 18h2",
    custom: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6z",
    // solutions
    systems: "M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10",
    desktop: "M3 4h18v12H3zM8 21h8M12 16v5M7 8l3 2-3 2M12.5 12H17",
    web: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2c3 3 4 6.5 4 10s-1 7-4 10c-3-3-4-6.5-4-10s1-7 4-10z",
    apps: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18.5h2M9 6h6M9 10h6",
    stores: "M6 7h12l1.5 14h-15zM9 10V6a3 3 0 0 1 6 0v4",
    automation: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z",
    ai: "M9 3h6M9 21h6M3 9v6M21 9v6M6 6h12v12H6zM9.5 15l1.8-6h1.4l1.8 6M10 13h4M16.5 9v6",
    product: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM17 13v8M13 17h8",
    // interface
    arrow: "M19 12H5M11 6l-6 6 6 6",
    chevron: "M6 9l6 6 6-6",
    check: "M4 12.5l5 5L20 6.5",
    x: "M6 6l12 12M18 6L6 18",
    alert: "M12 3l10 18H2zM12 10v5M12 18v.01",
    bulb: "M9 18h6M10 21h4M12 3a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.3 1 2.4h6c0-1.1.3-1.8 1-2.4A6.5 6.5 0 0 0 12 3z",
    shield: "M12 3l8 3v6c0 5-3.4 8-8 9.5C7.4 20 4 17 4 12V6zM8.5 12l2.5 2.5 4.5-5",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2",
    mail: "M3 5h18v14H3zM3 7l9 6.5L21 7",
    phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z",
    whatsapp: "M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zM8.8 8c-.5 0-1 .6-1 1.6 0 2.7 3.8 6.6 6.8 6.6 1 0 1.8-.8 1.8-1.5 0-.3-.1-.5-.3-.6l-1.8-.8c-.3-.1-.5 0-.7.2l-.6.8c-1.2-.5-2.3-1.6-2.9-2.8l.7-.7c.2-.2.2-.4.1-.7l-.7-1.7c-.1-.2-.3-.4-.5-.4z",
    send: "M21 3L10 14M21 3l-7 18-4-7-7-4z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2",
    doc: "M6 2h8l5 5v15H6zM14 2v5h5M9 13h6M9 17h6",
    pen: "M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",
    code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
    rocket: "M5 15c-1.5 1.2-2 4-2 6 2 0 4.8-.5 6-2M9 18l-3-3c1-4 4.5-11 15-12-1 10.5-8 14-12 15zM15 9v.01",
    headset: "M4 15v-3a8 8 0 0 1 16 0v3M4 14h3v6H4zM17 14h3v6h-3zM20 20c0 1.5-2 2-4 2h-3",
    calendar: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4M8 15l2.5 2.5L16 13",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    layers: "M12 3l10 5-10 5L2 8zM2 13l10 5 10-5M2 17.5l10 5 10-5",
    users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a7 7 0 0 1 14 0v1M16 3.5a4 4 0 0 1 0 7M18 14a6 6 0 0 1 4 6v1",
    menu: "M3 6h18M3 12h18M3 18h18"
  };
});
