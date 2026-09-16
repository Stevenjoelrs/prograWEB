# Prompt de Inteligencia Artificial — Simulador BBR

## 1. Modelo de IA utilizado

Se utilizó el modelo **Sonnet 5 en rendimiento MAX** de Anthropic como asistente de generación de código.

---

## 2. Prompt utilizado

> **Prompt:**
>
> Construye un simulador del algoritmo de control de congestión **BBR (Bottleneck Bandwidth and RTT)** de Google, escrito en **ANSI C (C89)** puro, sin librerías externas de gráficos ni ventanas.
>
> El simulador debe cumplir con lo siguiente:
>
> 1. **Simular las 4 fases de BBR:**
>    - **STARTUP:** crecimiento exponencial para descubrir el ancho de banda del cuello de botella (BtlBw).
>    - **DRAIN:** drenar la cola generada por el sobre-impulso de STARTUP.
>    - **PROBE_BW:** estado estable donde se cicla la ganancia de envío para sondear más ancho de banda periódicamente.
>    - **PROBE_RTT:** reducir la ventana al mínimo cada cierto número de rondas para medir el RTT real sin cola (RTprop).
>
> 2. **Cómputo de variables clave:**
>    - `BtlBw` (Bottleneck Bandwidth): usar un filtro de máximo deslizante sobre las muestras de tasa de entrega.
>    - `RTprop` (Round-Trip propagation time): usar un filtro de mínimo deslizante sobre las muestras de RTT.
>    - `BDP` (Bandwidth-Delay Product): calcular como `BtlBw × RTprop`.
>    - Retardo de cola (`delay`): diferencia entre el RTT medido y el RTT base.
>
> 3. **Permitir al usuario modificar los valores iniciales de la red:**
>    - Tasa de transmisión del enlace (en kB/s), con valor por defecto de 1000 kB/s.
>    - RTT base del enlace (en ms), con valor por defecto de 50 ms.
>    - Leer estos valores por `stdin`; si el usuario presiona Enter sin escribir nada, usar el valor por defecto.
>
> 4. **Mostrar gráficamente las fases y valores de BBR:**
>    - Imprimir una tabla ronda a ronda con: número de ronda, fase actual, BtlBw, RTT mínimo, RTT actual, BDP, delay y cwnd.
>    - Al finalizar, imprimir dos gráficos de barras horizontales en modo texto (ASCII) mostrando la evolución de BtlBw y el retardo de cola a lo largo de las rondas.
>
> 5. **Requisitos técnicos:**
>    - Debe compilar con `gcc -ansi -pedantic -Wall -Wextra` sin errores ni warnings.
>    - Simular 60 rondas (1 ronda ≈ 1 RTT).
>    - Incluir jitter aleatorio leve (±5%) para simular variabilidad de red realista.
>    - El buffer de la red debe ser 2× el BDP.
>    - Comentar el código en español.

---

## 3. Justificación del prompt

El prompt fue diseñado con las siguientes consideraciones:

### 3.1 Especificidad técnica
Se mencionó explícitamente **ANSI C (C89)** para garantizar que el código generado fuera compatible con el estándar requerido por la tarea, evitando el uso de características de C99 o posteriores (como declaraciones de variables en medio de bloques, `//` para comentarios, etc.).

### 3.2 Estructura por fases
Se describieron las 4 fases de BBR de forma clara para que la IA construyera una **máquina de estados** correcta. Esto es fundamental porque BBR no es un algoritmo trivial: cada fase tiene su propia lógica de ganancia (`pacing_gain`) y criterio de transición.

### 3.3 Fórmulas explícitas
Se especificaron las fórmulas de cómputo clave (`BDP = BtlBw × RTprop`, filtros de máximo y mínimo deslizantes) para que el código implementara la lógica real de BBR y no una aproximación simplificada.

### 3.4 Entrada del usuario
Se pidió explícitamente la funcionalidad de modificar los parámetros iniciales de la red (`stdin` con valores por defecto) porque es un requisito de la tarea y porque demuestra flexibilidad del simulador.

### 3.5 Salida gráfica en texto
Dado que ANSI C no tiene librerías gráficas estándar, se especificó que los gráficos fueran **barras horizontales en modo texto (ASCII)** como alternativa viable para cumplir el requisito de interfaz gráfica dentro de las limitaciones del lenguaje.

### 3.6 Validación de compilación
Se incluyó el comando de compilación exacto (`gcc -ansi -pedantic -Wall -Wextra`) como parte del prompt para que la IA generara código que pasara un nivel estricto de validación.

---

## 4. Resultado obtenido

La IA generó un archivo `simulador.c` de 363 líneas que:

- ✅ Compila sin errores ni warnings con `gcc -ansi -pedantic -Wall -Wextra`
- ✅ Implementa las 4 fases de BBR como máquina de estados
- ✅ Calcula correctamente BtlBw, RTprop, BDP y delay
- ✅ Permite al usuario cambiar la tasa de transmisión y el RTT inicial
- ✅ Muestra tabla de valores ronda a ronda
- ✅ Muestra gráficos de barras ASCII al finalizar
- ✅ Incluye jitter aleatorio para simular variabilidad de red
- ✅ Está comentado en español

---

## 5. Observaciones

- El prompt fue **iterativo**: se refinó hasta obtener un resultado que cumpliera todos los requisitos sin necesidad de modificaciones manuales significativas.
- La clave para obtener código de calidad fue ser **específico en los requisitos técnicos** (estándar del lenguaje, flags de compilación, fórmulas) en lugar de dar instrucciones vagas.
- El uso de valores numéricos concretos (como `HIGH_GAIN = 2.77 ≈ 2/ln(2)`) demuestra que la IA tiene conocimiento del paper original de BBR y no inventó constantes arbitrarias.
