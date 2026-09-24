# Documentación del Simulador BBR

## ¿Qué es BBR?

BBR significa **Bottleneck Bandwidth and Round-Trip Time** (Ancho de Banda del Cuello de Botella y Tiempo de Ida y Vuelta). Es un algoritmo creado por Google que se encarga de controlar qué tan rápido se mandan datos por una red, sin saturarla.

La idea básica es: en vez de mandar datos hasta que algo falle (que es lo que hacen otros algoritmos más viejos), BBR intenta descubrir dos cosas de la red:

- **¿Cuánto ancho de banda hay realmente?** (qué tan rápido puede pasar datos el punto más lento de la ruta)
- **¿Cuánto tarda un dato en ir y volver?** (el RTT sin que haya cola/espera)

Con esos dos números, BBR sabe exactamente cuántos datos puede tener "en vuelo" sin generar congestión.

---

## Las 4 fases

BBR funciona como una máquina que va pasando por 4 estados, uno tras otro:

### 1. STARTUP (Arranque)

Es la fase inicial. El programa empieza mandando pocos datos y va aumentando rápido (de forma exponencial) para descubrir cuánto aguanta la red. Es como ir acelerando un carro para ver qué tan rápido puede ir la carretera.

El problema es que al ir tan agresivo, genera un poco de "cola" (datos esperando). Cuando detecta que ya no está creciendo el ancho de banda (3 rondas sin mejora significativa), pasa a la siguiente fase.

### 2. DRAIN (Drenaje)

Aquí el programa baja la velocidad de envío para "drenar" toda la cola que generó en STARTUP. Básicamente deja de mandar tanto para que los datos acumulados se vayan procesando.

Cuando la cantidad de datos en vuelo baja hasta el BDP (el punto óptimo), pasa al estado estable.

### 3. PROBE_BW (Sondeo de Ancho de Banda)

Esta es la fase donde pasa la mayor parte del tiempo. El programa ya encontró más o menos cuánto aguanta la red, así que se mantiene mandando datos a un ritmo estable.

Pero de vez en cuando sube un poco la velocidad (ganancia de 1.25) para ver si hay más ancho de banda disponible, y luego baja (ganancia de 0.75) para compensar. Usa un ciclo de 8 pasos: `[1.25, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]`.

Después de cierto número de rondas, pasa brevemente a PROBE_RTT.

### 4. PROBE_RTT (Sondeo de RTT)

Cada cierto tiempo, el programa necesita medir de nuevo el RTT real de la red (sin cola). Para hacer eso, reduce drásticamente la ventana de envío (al mínimo) por unas pocas rondas. Así no hay datos haciendo cola y puede medir el delay limpio.

Después de eso, vuelve a PROBE_BW.

---

## Los valores clave que calcula

| Valor | Qué es | Cómo se calcula |
|---|---|---|
| **BtlBw** | El ancho de banda del cuello de botella | El máximo de las últimas muestras de tasa de entrega |
| **RTprop** | El RTT real sin cola | El mínimo de las últimas muestras de RTT |
| **BDP** | Producto ancho de banda × delay | `BtlBw × RTprop` |
| **Delay** | Retardo de cola | `RTT actual − RTT base` |
| **cwnd** | Ventana de congestión | Cuántos datos puede tener en vuelo |

---

## ¿Qué hace el simulador?

El programa simula una red ficticia durante **60 rondas** (cada ronda equivale a un viaje de ida y vuelta, un RTT). No usa una red real, sino que calcula matemáticamente qué pasaría.

### Entrada

Al ejecutar, te pide dos valores (si no escribes nada, usa los de default):

- **Tasa de transmisión del enlace** (default: 1000 kB/s)
- **RTT base** (default: 50 ms)

### Salida

1. **Tabla ronda a ronda**: muestra para cada ronda la fase actual, el BtlBw estimado, el RTT mínimo, el RTT actual, el BDP, el delay de cola y el tamaño de la ventana (cwnd).

2. **Gráficos de barras ASCII**: al final imprime dos gráficos en texto plano:
   - Evolución del BtlBw estimado por ronda
   - Evolución del retardo de cola por ronda

Ejemplo de la tabla:

```
Rnd  Fase        BtlBw   RTTmin   RTTact      BDP    delay     cwnd
                 (kB/s)     (ms)     (ms)     (kB)     (ms)     (kB)
1    STARTUP       80.0     50.0     50.0      4.0      0.0     11.1
2    STARTUP      221.6     50.0     50.0     11.1      0.0     30.7
3    STARTUP      613.8     50.0     50.0     30.7      0.0     85.0
...
```

Ejemplo de los gráficos:

```
--- BtlBw estimado por ronda (kB/s) ---
  1 | ### 80.0
  2 | ######## 221.6
  3 | ####################### 613.8
  4 | ######################################## 1043.1
...
```

---

## ¿Por qué los gráficos son en texto?

La tarea pide que el programa esté hecho en **ANSI C puro** (C89), y ese estándar no incluye ninguna librería para hacer ventanas o gráficos. Entonces la forma de "graficar" es usando caracteres como `#` para dibujar barras horizontales en la terminal. Es la mejor opción dentro de lo que permite el lenguaje.

---

## Cómo compilar y ejecutar

```bash
gcc -ansi -pedantic -Wall -Wextra -o simulador simulador_final.c
./simulador
```

El programa te pide los valores iniciales y luego corre la simulación completa mostrando todo en la terminal.
