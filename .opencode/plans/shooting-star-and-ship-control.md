# Plan: Estrella Fugaz + Control de Nave

## Tarea 1: Asteroide "Estrella Fugaz"

### Clase `ShootingStar` (nueva, después de clase `Asteroid`, ~línea 119)
- Hereda concepto de `Asteroid` pero es independiente
- `radius = 25` (ligeramente menor que size 2 para ser más desafiante)
- Velocidad: `160-200 px/s` (vs 55 de asteroide size 2 = ~3x más rápido)
- `ttl = 6` segundos — desaparece con fade-out (alpha decreciente)
- Forma visual: estrella de 5 puntas con color cyan/blanco brillante
- Trail de partículas detrás (reutilizar `SpeedParticle` con color cyan)
- No se divide al destruirla (`split()` vacío)
- Puntos: **200** al destruirla
- Al morir: explosión de partículas coloridas + efecto combo en borde

### Spawn periódico (~cada 12-15 segundos)
- Variable `shootingStarTimer` inicializada en `rand(12, 15)`
- Se decrementa en `update()`, al llegar a 0 spawnea 1 ShootingStar
- Spawn desde un borde aleatorio del canvas, con ángulo hacia el centro (+ variación)
- Reset del timer a `rand(12, 15)`
- Máximo 1 estrella fugaz activa a la vez

### Efecto "Combo" en borde (estilo Street Fighter)
- Variable `comboFlash` (timer ~0.8s)
- Array de colores: `['#ff0040', '#ffcc00', '#00ffcc', '#ff00ff', '#ff6600']`
- Mientras `comboFlash > 0`:
  - Ciclar rápidamente entre colores (~10 cambios/seg)
  - Dibujar borde grueso (4-6px) dentro del canvas con el color actual
  - Texto "COMBO!" centrado con fade-out
- Se activa al destruir una ShootingStar

### Integración en colisiones (en `update()`)
- Bala vs ShootingStar: misma lógica que bala vs asteroide
  - Destruir ambos, sumar 200 pts, explotar, activar `comboFlash`
- Nave vs ShootingStar: mata al jugador igual que un asteroide
- ShootingStar NO cuenta para completar nivel (no bloquea `nextLevel()`)
- ShootingStar se actualiza y dibuja junto con asteroides pero en array separado

### Arrays y estado
- Nuevo array: `shootingStars[]`
- Inicializar en `initGame()` y `nextLevel()`
- Filtrar por `.dead` en cada frame

---

## Tarea 2: Control de Nave (Fricción + Velocidad Máxima)

### Cambios en `Ship.update()` (~líneas 146-162)
- `DRAG`: `0.987` → `0.97` (la nave frena notablemente más rápido al soltar thrust)
- `MAX_SPEED`: nuevo constante = `280` px/s
- Después de aplicar thrust y drag, limitar velocidad:
  ```
  const speed = Math.hypot(this.vx, this.vy);
  if (speed > MAX_SPEED) {
    this.vx = (this.vx / speed) * MAX_SPEED;
    this.vy = (this.vy / speed) * MAX_SPEED;
  }
  ```
- Esto evita que la nave acelere infinitamente al mantener ArrowUp

### Sensación de juego
- Antes: la nave "patina" sin frenos, difícil de controlar
- Después: la nave tiene inercia pero frena en ~1-2 segundos al soltar thrust
- El tope de velocidad previene que se vuelva inmanejable a altas velocidades
- El speedBoost (x2) sigue funcionando pero sobre el tope (560 px/s max con boost)

---

## Archivos a modificar
- `game.js` — todos los cambios son aquí (single-file game)

## Verificación
- Servir con `npx serve .` y probar en navegador
- Verificar: estrella fugaz aparece cada ~12-15s, se mueve rápido, desaparece con fade
- Verificar: al destruirla, borde cambia de colores rápidamente
- Verificar: nave tiene más control, no acelera infinitamente
- Verificar: speedBoost sigue funcionando correctamente
