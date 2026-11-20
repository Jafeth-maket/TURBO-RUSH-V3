// Ajusta el proyecto Android generado por Capacitor:
//   - pantalla siempre en horizontal (se puede girar a ambos lados)
//   - pantalla completa (sin barra de estado)
//   - ícono propio (icons/foreground.png)
// Es seguro ejecutarlo varias veces.
const fs = require("fs");
const path = require("path");

const root = __dirname;
const res = path.join(root, "android", "app", "src", "main", "res");
const manifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
const BG = "#2e7d32"; // color de fondo del ícono

if (!fs.existsSync(manifestPath)) {
  console.error("No existe la carpeta android/. Ejecuta primero: npx cap add android");
  process.exit(1);
}

// 1) Orientación horizontal (reemplaza cualquier orientación anterior)
let m = fs.readFileSync(manifestPath, "utf8");
if (/android:screenOrientation="[^"]*"/.test(m)) {
  m = m.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="sensorLandscape"');
} else {
  m = m.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"');
}
if (!m.includes("android.permission.VIBRATE")) {
  m = m.replace("<application", '<uses-permission android:name="android.permission.VIBRATE" />\n    <application');
}
fs.writeFileSync(manifestPath, m);
console.log("✔ Orientación horizontal + vibración");

// 2) Pantalla completa
const stylesPath = path.join(res, "values", "styles.xml");
let s = fs.readFileSync(stylesPath, "utf8");
if (!s.includes("windowFullscreen")) {
  s = s.replace('<item name="android:background">@null</item>',
    '<item name="android:background">@null</item>\n        <item name="android:windowFullscreen">true</item>');
  fs.writeFileSync(stylesPath, s);
  console.log("✔ Pantalla completa");
}


// 2b) Pantalla completa REAL (modo inmersivo): oculta la barra con hora, wifi y batería
//     y la de navegación. Si deslizas desde el borde aparecen un momento y se vuelven a ocultar.
//     También deja que el juego use la zona de la cámara (notch).
(function immersive() {
  const javaRoot = path.join(root, "android", "app", "src", "main", "java");
  let file = null;
  (function find(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) find(p); else if (e.name === "MainActivity.java") file = p;
    }
  })(javaRoot);
  if (!file) { console.warn("(no se encontró MainActivity.java: no se pudo activar el modo inmersivo)"); return; }
  const pkg = (fs.readFileSync(file, "utf8").match(/^\s*package\s+([\w.]+)\s*;/m) || [])[1];
  if (!pkg) { console.warn("(MainActivity.java sin package)"); return; }
  fs.writeFileSync(file, `package ${pkg};

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30
                ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (c == null) return;
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }
}
`);
  console.log("✔ Pantalla completa inmersiva (sin barra de estado ni de navegación)");
})();

// 3) Ícono
(async () => {
  let sharp;
  try { sharp = require("sharp"); } catch (e) { console.warn("(sharp no instalado: se deja el ícono por defecto)"); return; }
  const fg = path.join(root, "icon-foreground.png");
  if (!fs.existsSync(fg)) { console.warn("(no hay icon-foreground.png: se deja el ícono por defecto)"); return; }

  fs.writeFileSync(path.join(res, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);

  const dens = { mdpi: [108, 48], hdpi: [162, 72], xhdpi: [216, 96], xxhdpi: [324, 144], xxxhdpi: [432, 192] };
  const bg = { r: 0x2e, g: 0x7d, b: 0x32, alpha: 1 };
  for (const [d, [fgSize, icSize]] of Object.entries(dens)) {
    const dir = path.join(res, `mipmap-${d}`);
    // capa de frente (adaptativo)
    await sharp(fg).resize(fgSize, fgSize).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
    // ícono clásico: se recorta la zona central y se pone sobre el color de fondo
    const square = await sharp(fg).extract({ left: 60, top: 60, width: 312, height: 312 }).resize(icSize, icSize).png().toBuffer();
    const flat = await sharp({ create: { width: icSize, height: icSize, channels: 4, background: bg } })
      .composite([{ input: square }]).png().toBuffer();
    await sharp(flat).png().toFile(path.join(dir, "ic_launcher.png"));
    const mask = Buffer.from(`<svg width="${icSize}" height="${icSize}"><circle cx="${icSize / 2}" cy="${icSize / 2}" r="${icSize / 2}" fill="#fff"/></svg>`);
    await sharp(flat).composite([{ input: mask, blend: "dest-in" }]).png().toFile(path.join(dir, "ic_launcher_round.png"));
  }
  console.log("✔ Ícono");
})();
