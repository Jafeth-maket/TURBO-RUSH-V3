# 🏎️ Turbo Rush 3D

Juego de carreras **original**, hecho desde cero. Todo el código es tuyo: puedes cambiarlo, venderlo o publicarlo como quieras.

Esquiva el tráfico en 3D, junta monedas, gana dinero y mejora tu auto en el garaje (motor, nitro, llantas) o compra autos nuevos.

## 📁 Archivos

| Archivo | Qué es |
|---|---|
| `config.js` | **Aquí cambias el dinero, la velocidad del motor, precios, autos, tráfico…** |
| `game.js` | Toda la lógica y el mundo 3D: modos, colisiones, power-ups, misiones, garaje, guardado, sonido y música |
| `gfx.js` | Gráficos modernos: shaders de pintura/cristal, cielo, carretera, bloom y desenfoque de velocidad |
| `cars.js` | Los autos japoneses (5 modelos) y toda la personalización: pintura, rines, alerones, kits, neón... |
| `three.min.js` | Librería 3D [Three.js](https://threejs.org) (licencia MIT), solo las piezas que usa el juego. No hace falta tocarla |
| `index.html` / `style.css` | Pantallas (menú, garaje, pausa, fin de partida) |
| `package.json`, `capacitor.config.json` | Empaquetado a Android (Capacitor) |
| `build-web.js`, `patch-android.js` | Scripts que preparan el APK (horizontal, pantalla completa, ícono) |
| `build-single-file.js` | Junta todo el juego en un solo `.html` |
| `icon-foreground.png` | Ícono de la app |
| `build-apk.yml` | Copia visible del workflow de GitHub (ver Opción A, paso 3) |
| `.github/workflows/build-apk.yml` | Workflow que compila el APK en la nube |

## ⚙️ Cambiar dinero y velocidad del motor (`config.js`)

```js
dineroInicial: 50000,      // empieza con más dinero
valorMoneda: 25,           // cada moneda vale más
autos: [{ id: "rojo", velMax: 260, aceleracion: 45, ... }],   // velocidad máxima (km/h) y aceleración
mejoras: { motor: { velPorNivel: 25, costoBase: 100, ... } }  // cuánto da y cuánto cuesta cada nivel de motor
nitroBase: 1.5,            // el nitro multiplica la velocidad x1.5
nitroMinimo: 0.15,         // tras vaciarse, el nitro se bloquea hasta soltar el botón y recargar este %
velocidadLateral: 14,      // qué tan rápido gira el auto con las flechas
```

El progreso se guarda en el dispositivo. Si cambias `saveKey` el progreso se reinicia.

## ▶️ Probarlo sin instalar nada

El juego se juega en **horizontal** (gira el celular). Abre `index.html` en cualquier navegador (en PC: flechas ← →, **Espacio** = nitro, **Esc** = pausa).
En el celular: flechas ◀ ▶ abajo a la izquierda para girar (mantenlas apretadas) y botón **NITRO** abajo a la derecha. Puedes usar los dos a la vez.

Para tener todo en un solo archivo: `npm run un-solo-archivo` → `dist/turbo-rush.html`.

## 🏁 Modo carrera (`config.js` → `carrera`)

Desde el menú: **🏁 CARRERA**. Cuenta regresiva 3-2-1 y corres contra 3 bots hasta la meta, **con el tráfico de siempre**.

- Los bots esquivan el tráfico (y a ti), frenan si no hay carril libre, usan nitro (con el mismo bloqueo al vaciarse) y a veces **no ven un carro y chocan**.
- Si un bot choca, o chocas tú, **reaparecen en el mismo lugar y carril** donde chocaron, con 2 s de parpadeo sin poder chocar.
- Arriba ves tu puesto (🏁 2/4) y una barra con la posición de cada bot.
- Al llegar a la meta ganas dinero según el puesto.
- Los bots se ajustan a **tu auto** (`nivel` 1.0 = igual de rápido que tú); mejora tu auto y ellos también suben.

```js
carrera: { metaMetros: 3000, invulnerable: 2.0, premios: [500, 250, 120, 50],
           rivales: [{ nombre: "Rayo", color: "#00e5ff", nivel: 0.93, error: 0.30 }, ...] }
```
`error` = probabilidad de que el bot NO esquive un carro (más alto = choca más). Puedes agregar o quitar rivales (máximo 3 con 4 carriles).

## 📱 Generar el APK

### Opción A: desde el celular, sin PC (GitHub)

1. Crea una cuenta en github.com y un **repositorio nuevo** (puede ser privado).
2. En el repositorio: **Add file → Upload files**. Selecciona **todos los archivos** de esta carpeta (los de la raíz, no hace falta `package-lock.json`) → **Commit changes**.
3. **Add file → Create new file**. En el nombre escribe `.github/workflows/build-apk.yml` (al escribir las `/` se crean las carpetas). Abre el archivo `build-apk.yml` de esta carpeta, copia todo su contenido, pégalo ahí → **Commit changes**.
4. Entra a la pestaña **Actions**. Verás "Compilar APK" corriendo (5–10 minutos). Cuando salga ✅ ya está.
5. En la página principal del repositorio, abre **Releases → Turbo Rush - última versión** y descarga **`turbo-rush.apk`**.
6. Instálalo (Android te pedirá permitir "instalar apps desconocidas" para tu navegador).

Cada vez que cambies un archivo (por ejemplo `config.js`) y hagas Commit, el APK se vuelve a compilar y se actualiza solo en Releases.

### Opción B: en una PC con Android Studio

Necesitas Node 22+, JDK 21 y Android Studio.

```bash
npm install
npm run android:agregar     # crea la carpeta android/ con los ajustes
npm run android:abrir       # abre el proyecto en Android Studio
# Build → Build APK(s)      (o: npm run apk)
```

Tras cambiar el juego: `npm run android:sync`.

## 🧠 Cómo está hecho (`game.js`)

- **Guardado**: `localStorage` (dinero, autos comprados, mejoras, récord).
- **Mundo 3D**: el auto está quieto en el origen y la carretera, el tráfico y los árboles vienen hacia él; el tráfico se mueve según la velocidad *relativa*. 1 unidad = 1 metro. Los autos se arman con cajas y cilindros (`carMesh` y `truckMesh`), sin archivos de modelos.
- **Controles**: `hold()` en `game.js` mantiene presionados los botones (varios dedos a la vez).
- **Tráfico**: filas de 1–2 vehículos (camiones incluidos) con separación en metros que crece con la velocidad; siempre queda un carril libre.
- **Garaje**: cada auto tiene sus propias mejoras. El costo del nivel N es `costoBase × crecimiento^N`.
- **Sonido**: generado con WebAudio, sin archivos.

## ⚠️ Notas

- El APK que sale es de **depuración** (firmado con la clave de debug de Android): sirve para instalar y probar. Para subirlo a Google Play hay que compilar una versión *release* firmada con tu propia clave.
- Nombre de la app e identificador: `capacitor.config.json` (`appName`, `appId`).


## 🆕 Novedades (versión 2)

- **Autos estilo japonés**: Kaze Hachi (compacto), Hayate RX (coupé), Kitsune Drift (sedán), Ryu GT (coupé ancho) y Shinobi LM (superdeportivo). Se definen en `config.js` (`autos`, campo `modelo`) y se dibujan en `cars.js`.
- **Personalización completa** (Garaje → pestañas): color, acabado (metálico/perlado/cromo), techo, acentos, 6 estilos de rin, color y tamaño de rin, pinzas de freno, alerón, kit de carrocería (incluye ensanchado), cofre, suspensión baja, franjas, vidrios, neón, color de faros, escape y color de la llama del nitro. Los precios están en `config.js` → `personalizar`.
- **Sensación de velocidad**: líneas de velocidad, viñeta y vibración de cámara con nitro, chispas al raspar el borde.
- **Casi-choques** con combo (monedas + nitro), **power-ups** en la pista (🛡️ escudo, 🧲 imán, ⚡ nitro gratis, 💰 monedas x2).
- **Modos**: Carrera (dificultad de bots elegible), Contrarreloj con fantasma de tu mejor tiempo, Supervivencia (3 vidas, tráfico cada vez más denso) y Modo libre.
- **Progreso**: 3 misiones diarias, logros con premio y récords/top 5.
- **Sonido**: música que acelera con la velocidad, efectos nuevos y vibración del celular.
- **Ajustes**: sonido, música, vibración, calidad gráfica, dificultad, pista fija y distancia de carrera. Tutorial la primera vez.
- Si ya tenías partida guardada, se conserva (el guardado se amplía solo).

## 🎨 Versión 3 (gráficos)

- Autos con carrocería curva (modelada por secciones), pintura con reflejos, cristales, faros y luces LED que brillan, rines detallados y sombra de contacto.
- Cielo con sol, nubes, montañas y ciudad iluminada; carretera con brillo, pianos rojiblancos y barandales; 5 ambientes (campo, desierto, nieve, ciudad de noche, atardecer).
- Menú y taller sobre una sala de exhibición 3D con el auto girando y su reflejo.
- Efectos: bloom, desenfoque radial con la velocidad y nitro. Se controlan con Ajustes → Calidad gráfica (Baja = sin efectos de pantalla, para celulares lentos).

## 🏁 Versión 4 (diseño por marca y pantalla completa)

- **Cada auto tiene su propia marca y diseño** (`config.js` → `marca`, `cars.js` → `sig`, `grille`, `head`, `tail`): Kaze (compacto con faros retráctiles y alerón de techo), Hayate (fastback largo con faros alargados, tomas en el cofre y alerón GT alto), Kitsune (sedán con cola de pato y respiraderos en las salpicaderas), Ryu (coupé con doble faro redondo, toma en el cofre y alerón de hoja) y Shinobi (superdeportivo con tomas laterales, rejillas en el motor, difusor y alerón bajo). Son diseños originales inspirados en el estilo de los deportivos japoneses.
- **Mensajes más discretos**: ahora salen pequeños a la derecha (no en medio de la pista), los logros esperan a que termine la carrera, y puedes elegir **Ajustes → 💬 Mensajes en pantalla** (Ninguno / Pocos / Todos). Por defecto: `mensajes: 1` en `config.js`.
- **Pantalla completa real en el APK**: se ocultan la barra de arriba (hora, wifi, batería) y los botones de abajo (`patch-android.js`, modo inmersivo). Si deslizas desde el borde aparecen un momento y se vuelven a ocultar.

## 💎 Versión 7 (autos de lujo y garaje)

- Cada auto tiene su propio modelo 3D: además de los 5 deportivos, **Imperial GT** (GT de lujo), **Fenice Corsa** (deportivo italiano), **Furia X** (cuña angular) y **Aurelian Noir** (hiperauto con herradura y línea en C). Son diseños originales; no uses nombres ni logos de marcas reales si vas a publicar en Google Play.
- El tráfico ya no recoge monedas ni power-ups.
- Garaje: iluminación de estudio más clara, plataforma con anillos de neón, barras diagonales de fondo y logo "TURBO RUSH CUP".

## 🚗 Versión 9: autos con modelos 3D propios (.glb)

- `models.js` contiene los modelos 3D convertidos de tus archivos .glb (se bajaron de ~218 000 a ~52 000 triángulos y se quitaron las partes interiores que no se ven). Se cargan en `cars.js` (`buildGLB`).
- **Rayo 72** (`modelo: "rayo"`) y **Kaiser GT** (`modelo: "sport"`) se definen en `config.js` como cualquier otro auto. En estos autos funcionan: color, acabado, color de rines, neón y llama del nitro. Los kits de carrocería, alerones y cofres no aplican (son del modelo procedural).
- ⚠️ Antes de publicar en Google Play revisa las licencias de los modelos y que no sean vehículos de una marca o personaje registrado.
