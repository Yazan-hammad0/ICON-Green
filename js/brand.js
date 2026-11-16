/* Every logo reference in the app's code lives here. The designer's final files replace the ones in icons/ under the same names.
   The home-screen icons are also named in index.html (two <link> tags), manifest.webmanifest and sw.js: keep those file names. */
var Brand = {
  name: "ICON Green",
  logo: "icons/logo.png",        /* icon plus wordmark, transparent, dark green ink: always shown on a light plate */
  logoW: 640, logoH: 185,
  icon: "icons/icon.png",        /* square icon alone, for small sizes */
  appIcon: "icons/icon-180.png", /* full-bleed app icon, used in the install guide */
  logoImg: function(cls){ return '<img class="' + (cls || "logo") + '" src="' + this.logo + '" width="' + this.logoW + '" height="' + this.logoH + '" alt="' + this.name + '">'; },
  iconImg: function(cls){ return '<img class="' + (cls || "brand-icon") + '" src="' + this.icon + '" width="64" height="64" alt="">'; }
};
