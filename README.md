# Asteroids Game - README Técnico

## Descripción General

Este proyecto es una implementación del clásico juego de arcade **Asteroids** desarrollado en JavaScript puro, HTML5 Canvas y CSS. El juego permite al jugador controlar una nave espacial, disparar a asteroides y sobrevivir a través de niveles progresivamente más difíciles.

## Arquitectura Básica

### Estructura de Archivos
```
asteroids-v0-agent/
├── index.html          # Estructura HTML principal
├── styles.css          # Estilos CSS para la interfaz
├── AsteroidsGame.js    # Lógica completa del juego
└── public/             # Recursos multimedia (sonidos, música)
    ├── PixelHeartbeat.mp3
    ├── laser.wav
    ├── asteroidexplotion.wav
    └── shipexplotion.wav
```

### Arquitectura del Código

El proyecto sigue una arquitectura simple y monolítica basada en un único archivo JavaScript (`AsteroidsGame.js`) que contiene toda la lógica del juego. La estructura se basa en:

#### Estado Global (`state`)
Un objeto central que mantiene el estado completo del juego:
- **ship**: Posición, velocidad, ángulo y estado de la nave
- **bullets**: Array de balas activas
- **asteroids**: Array de asteroides en pantalla
- **particles**: Efectos visuales (partículas de propulsión y explosiones)
- **score, level, lives**: Estadísticas del juego
- **keys**: Estado de las teclas presionadas
- **gameOver, started**: Estados del juego

#### Funciones Principales

1. **Inicialización y Configuración**
   - `startGame()`: Reinicia el estado y comienza el juego
   - `initLevel(level)`: Genera asteroides para un nivel específico
   - `resetShip()`: Reposiciona la nave al centro

2. **Lógica de Juego**
   - `update()`: Función principal del bucle de juego (llamada por `requestAnimationFrame`)
   - Manejo de entrada del teclado (`handleKeyDown`, `handleKeyUp`)
   - Física de movimiento (propulsión, fricción, wrapping de pantalla)
   - Detección de colisiones (círculo vs círculo)

3. **Renderizado**
   - `draw()`: Dibuja todos los elementos en el canvas
   - `renderOverlay()`: Actualiza la interfaz de usuario superpuesta

4. **Utilidades**
   - `wrapPosition()`: Implementa el wrapping toroidal de la pantalla
   - `circleCollision()`: Detección de colisiones circulares
   - `createExplosion()`: Genera partículas de explosión
   - `splitAsteroid()`: Divide asteroides al ser destruidos

## Cómo Funciona el Juego

### Mecánicas Principales

1. **Control de la Nave**
   - **Rotación**: Flechas izquierda/derecha rotan la nave
   - **Propulsión**: Flecha arriba acelera la nave en dirección actual
   - **Frenado**: Flecha abajo reduce la velocidad gradualmente
   - **Disparo**: Barra espaciadora dispara balas

2. **Física del Movimiento**
   - La nave tiene inercia y fricción (`FRICTION = 0.99`)
   - Velocidad máxima limitada (`MAX_SPEED = 8`)
   - La pantalla es toroidal: objetos salen por un lado y entran por el opuesto

3. **Asteroides**
   - Tres tamaños: grande (40px), medio (22px), pequeño (12px)
   - Generados proceduralmente con formas irregulares
   - Se dividen en asteroides más pequeños al ser destruidos
   - Velocidad aumenta con el tamaño (más pequeños son más rápidos)

4. **Sistema de Colisiones**
   - Colisión nave-asteroide: Pierde una vida
   - Colisión bala-asteroide: Destruye el asteroide y gana puntos
   - Invulnerabilidad temporal después de perder una vida

5. **Progresión del Juego**
   - Niveles con más asteroides (3 + nivel)
   - Puntuación: 100 puntos por asteroide destruido
   - 3 vidas iniciales
   - Game Over cuando se pierden todas las vidas

### Efectos Visuales y Audio

- **Partículas de propulsión**: Efecto de fuego cuando la nave acelera
- **Explosiones**: Partículas blancas al destruir asteroides o perder la nave
- **Música de fondo**: Reproducción continua durante el juego
- **Efectos de sonido**: Disparos, explosiones de asteroides y nave

### Bucle de Juego

El juego utiliza `requestAnimationFrame` para un bucle de actualización suave:

```
update() -> Física y lógica -> draw() -> renderOverlay() -> requestAnimationFrame(update)
```

### Constantes de Configuración

```javascript
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const SHIP_SIZE = 15;
const ROTATION_SPEED = 0.08;
const THRUST_POWER = 0.18;
// ... más constantes para física, tamaños, etc.
```

## Tecnologías Utilizadas

- **HTML5 Canvas**: Para renderizado 2D
- **JavaScript ES6+**: Lógica del juego
- **CSS3**: Estilos y layout
- **Web Audio API**: Reproducción de sonidos y música

## Limitaciones y Consideraciones Técnicas

- Arquitectura monolítica: Toda la lógica en un solo archivo
- No hay separación de módulos o clases orientadas a objetos
- Estado global mutable
- Dependiente de recursos de audio locales
- No optimizado para móviles (controles de teclado únicamente)

Esta implementación proporciona una base sólida para el juego clásico de Asteroids, con potencial para expansiones futuras como múltiples naves, power-ups o modos de juego adicionales.