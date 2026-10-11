/* Unite icons: the same flat glyphs as uniteuow.com (src/components/icons/Icon.jsx), no emoji.
   Write <i data-icon="music" class="h-5 w-5"></i> and this swaps it for the SVG. One colour (currentColor), the
   accent part a softer tint. Layers: f = filled body, a = filled accent, s = stroke, sa = accent stroke. */
(function () {
  var ICONS = {"calendar":[["f","M6 5h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3zM7 14a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM11 14a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM15 14a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM7 17.6a1 1 0 1 0 2 0a1 1 0 1 0 -2 0zM11 17.6a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z"],["a","M6 5h12a3 3 0 013 3v2H3V8a3 3 0 013-3z"],["f","M8.2 2.6a1 1 0 011 1v3a1 1 0 01-2 0v-3a1 1 0 011-1zM15.8 2.6a1 1 0 011 1v3a1 1 0 01-2 0v-3a1 1 0 011-1z"]],"pin":[["f","M12 2.5a7 7 0 017 7c0 5-5.4 10.3-6.3 11.2a1 1 0 01-1.4 0C10.4 19.8 5 14.5 5 9.5a7 7 0 017-7zM12 6.8a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z"]],"music":[["f","M7.4 5.8L20 2.6V16h-2.6V6.2l-7.4 1.8V18.2H7.4z"],["f","M3.6999999999999997 18.2a3.1 3.1 0 1 0 6.2 0a3.1 3.1 0 1 0 -6.2 0z"],["a","M13.700000000000001 16a3.1 3.1 0 1 0 6.2 0a3.1 3.1 0 1 0 -6.2 0z"]],"party":[["f","M3.6 20.4l4.6-12.2 7.6 7.6zM6.6 15.2l2.2 2.2-1.6.6-1.2-1.2z"],["a","M13.5 4.4a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0zM18.400000000000002 8.2a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0zM17.700000000000003 13.8a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0zM10.6 2.8l1.7 1.1-1 1.5-1.7-1.1zM16.6 9.6c1.1-.9 2.4-1 3.4-.4l-.5 1c-.7-.4-1.5-.3-2.2.3z"]],"star":[["f","M12 2.8L14.35 9.06L21.04 9.36L15.8 13.54L17.58 19.99L12 16.3L6.42 19.99L8.2 13.54L2.96 9.36L9.65 9.06Z"]],"ball":[["f","M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0 -19 0z"],["a","M12 7.4l4.3 3.1-1.6 5h-5.4l-1.6-5z"]],"gift":[["f","M4 11h16v8.5A1.5 1.5 0 0118.5 21h-13A1.5 1.5 0 014 19.5zM3 7.5h18v3H3z"],["a","M11 7.5h2V21h-2zM12 7.3c-1-2.6-4.5-4-5.4-2.2-.8 1.5 1.6 2.4 5.4 2.2zM12 7.3c1-2.6 4.5-4 5.4-2.2.8 1.5-1.6 2.4-5.4 2.2z"]],"people":[["f","M3.4999999999999996 9a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0zM16.299999999999997 9a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0zM1.5 18.6a4 4 0 016.3-3.3A6.6 6.6 0 006.2 19.5H2a.5.5 0 01-.5-.5zM22.5 18.6a4 4 0 00-6.3-3.3 6.6 6.6 0 011.6 4.2H22a.5.5 0 00.5-.5z"],["a","M9.1 7.6a2.9 2.9 0 1 0 5.8 0a2.9 2.9 0 1 0 -5.8 0zM7 19.3a5 5 0 0110 0v.4a.6.6 0 01-.6.6H7.6a.6.6 0 01-.6-.6z"]],"person":[["f","M8 7.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0zM4.5 20.4a7.5 7.5 0 0115 0 .6.6 0 01-.6.6H5.1a.6.6 0 01-.6-.6z"]],"home":[["f","M12 3.2l8.6 7.3a1.1 1.1 0 01.4.8v8.9a1.5 1.5 0 01-1.5 1.5H15v-5.6a1.1 1.1 0 00-1.1-1.1h-3.8A1.1 1.1 0 009 16.1v5.6H4.5A1.5 1.5 0 013 20.2v-8.9a1.1 1.1 0 01.4-.8z"],["a","M10 16.2h4v5.5h-4z"]],"qr":[["f","M3 3h7.5v7.5H3zM4.8 4.8h3.9v3.9H4.8zM5.9 5.9h1.7v1.7H5.9zM13.5 3H21v7.5h-7.5zM15.3 4.8h3.9v3.9h-3.9zM16.4 5.9h1.7v1.7h-1.7zM3 13.5h7.5V21H3zM4.8 15.3h3.9v3.9H4.8zM5.9 16.4h1.7v1.7H5.9zM13.5 13.5H16V16h-2.5zM18.5 13.5H21V16h-2.5zM13.5 18.5H16V21h-2.5zM18.5 18.5H21V21h-2.5z"],["a","M16 16h2.5v2.5H16z"]],"ticket":[["f","M3 8a2 2 0 012-2h14a2 2 0 012 2v2.2a1.8 1.8 0 000 3.6V16a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.2a1.8 1.8 0 000-3.6V8zM15 7.6h1.2v1.6H15zM15 11.2h1.2v1.6H15zM15 14.8h1.2v1.6H15z"],["a","M9.5 9L10.26 10.95L12.35 11.07L10.74 12.4L11.26 14.43L9.5 13.3L7.74 14.43L8.26 12.4L6.65 11.07L8.74 10.95Z"]],"clock":[["f","M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0 -19 0z"],["a","M11.2 6.4h1.6v5.3l3.3 2.1-.85 1.35-4.05-2.55z"]],"mail":[["f","M5.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9A2.5 2.5 0 015.5 5z"],["sa","M4 7.5l8 5.8 8-5.8"]],"lock":[["s","M8 10.5V7.5a4 4 0 018 0v3"],["f","M6.5 10.5h11a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5V12a1.5 1.5 0 011.5-1.5z"],["a","M10.4 15.2a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0z"]],"shield":[["f","M12 2.5l8 3.2v5.8c0 5-3.4 9-8 10.5-4.6-1.5-8-5.5-8-10.5V5.7z"],["sa","M8.5 12l2.5 2.5 4.5-5"]],"check":[["s","M4.5 12.5l5 5 10-11"]]};
  (function () {
  var n = 0;
  var maskPath = function (k) {
    return k[0] === "f" || k[0] === "a"
      ? '<path d="' + k[1] + '" fill="#000" stroke="#000" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd"/>'
      : '<path d="' + k[1] + '" fill="none" stroke="#000" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>';
  };
  function svg(name) {
    var layers = ICONS[name] || ICONS.check, id = "ui" + n++, defs = "", out = "";
    layers.forEach(function (l, i) {
      var last = i === layers.length - 1, soft = l[0] === "a" || l[0] === "sa", fill = l[0] === "f" || l[0] === "a";
      if (!last) defs += '<mask id="' + id + "m" + i + '" maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28"><rect x="-2" y="-2" width="28" height="28" fill="#fff"/>' + layers.slice(i + 1).map(maskPath).join("") + "</mask>";
      var paint = fill
        ? (soft ? "fill:var(--icon-accent,currentColor);fill-opacity:var(--icon-accent-o,0.7)" : "fill:currentColor")
        : (soft ? "stroke:var(--icon-accent,currentColor);stroke-opacity:var(--icon-accent-o,0.7)" : "stroke:currentColor");
      var path = fill ? '<path d="' + l[1] + '" fill-rule="evenodd" style="' + paint + '"/>'
        : '<path d="' + l[1] + '" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="' + paint + '"/>';
      out += "<g" + (last ? "" : ' mask="url(#' + id + "m" + i + ')"') + ">" + path + "</g>";
    });
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><defs>' + defs + "</defs>" + out + "</svg>";
  }
  function render(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach(function (el) {
      var t = document.createElement("span");
      t.innerHTML = svg(el.getAttribute("data-icon"));
      var s = t.firstChild;
      s.setAttribute("class", el.className);
      el.replaceWith(s);
    });
  }
  window.uniteIcons = render;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { render(); }); else render();
})();
})();
