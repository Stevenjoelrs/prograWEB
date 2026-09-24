# Reflexión y Cambios — Del código generado al código final

## ¿Qué se generó?

Se le pidió a la IA (Sonnet 5 en rendimiento MAX) que hiciera un simulador de BBR en C puro. El archivo que generó es `simulador.c`, tiene 363 líneas y la verdad salió bastante bien a la primera. Compiló sin errores, las 4 fases funcionaban, los gráficos se veían bien.

Pero al probarlo más a fondo se encontró un bug.

---

## El bug que se encontró

### ¿Qué pasaba?

La función `read_double_with_default` lee lo que escribe el usuario con `fgets` usando un buffer de 64 caracteres. Si el usuario escribe (o pega) algo más largo que 63 caracteres, `fgets` corta ahí y lo que sobra se queda en `stdin`.

¿El problema? Eso que sobra se lo "come" la siguiente llamada a `read_double_with_default`. Entonces si escribías algo largo en la primera pregunta (tasa de transmisión), la segunda pregunta (RTT) ni siquiera te dejaba escribir: agarraba la basura que quedó en stdin y usaba el valor por defecto sin decirte nada.

### ¿Cómo se reprodujo?

Se mandó una primera respuesta de 76 caracteres y después "777" para el RTT. El programa ignoró el "777" y usó 50.0 ms (el default). El segundo input nunca se leyó.

### ¿Dónde estaba el problema?

En la función `read_double_with_default` del archivo original:

```c
/* CÓDIGO ORIGINAL (simulador.c) */
double read_double_with_default(const char *prompt, double def) {
  char line[64];
  double val;

  printf("%s [%.2f]: ", prompt, def);
  if (fgets(line, sizeof(line), stdin) == NULL) {
    return def;
  }
  if (line[0] == '\n' || line[0] == '\0') {
    return def;
  }
  val = atof(line);
  if (val <= 0.0) {
    return def;
  }
  return val;
}
```

El problema es que `fgets` lee hasta 63 caracteres (el 64° es el `\0`). Si la línea era más larga, el `\n` nunca llegaba al buffer y el sobrante quedaba en `stdin` esperando a ser leído por la siguiente llamada.

---

## El arreglo

La solución fue simple: después de leer con `fgets`, revisar si la línea leída tiene un `\n`. Si no lo tiene, significa que la entrada era más larga que el buffer, entonces hay que vaciar todo lo que quedó en `stdin` antes de continuar.

```c
/* CÓDIGO CORREGIDO (simulador_final.c) */
double read_double_with_default(const char *prompt, double def) {
  char line[64];
  double val;
  int i, has_newline, c;

  printf("%s [%.2f]: ", prompt, def);
  if (fgets(line, sizeof(line), stdin) == NULL) {
    return def;
  }

  has_newline = 0;
  for (i = 0; line[i] != '\0'; i++) {
    if (line[i] == '\n') { has_newline = 1; break; }
  }
  if (!has_newline) {
    while ((c = getchar()) != '\n' && c != EOF) { /* descartar */ }
  }

  if (line[0] == '\n' || line[0] == '\0') return def;
  val = atof(line);
  return (val <= 0.0) ? def : val;
}
```

### ¿Qué cambió exactamente?

1. Se agregaron las variables `i`, `has_newline` y `c`.
2. Se recorre el string leído buscando un `\n`.
3. Si no se encuentra, se lee y descarta todo lo que queda en `stdin` con un `while` + `getchar()`.
4. El resto de la lógica quedó igual, solo se compactó un poco el estilo.

---

## Qué se aprendió del prompting

- La IA generó código que funcionaba bien para el "camino feliz" (cuando el usuario escribe cosas normales). Pero no contempló casos raros como inputs extremadamente largos.
- Esto es normal: si en el prompt no le pides que maneje edge cases de entrada, no los va a manejar.
- La lección es que después de que la IA te genera algo, **siempre hay que probarlo** con entradas raras, no solo con las esperadas.
- El prompt original fue bastante bueno porque fue específico (pidió ANSI C, las 4 fases, las fórmulas, etc.), pero le faltó pedir manejo robusto de entrada del usuario.

---

## Resumen de archivos

| Archivo | Qué es |
|---|---|
| `simulador.c` | El código tal cual lo generó la IA, sin modificar |
| `simulador_final.c` | El código con el bug corregido |
| `documentacion_bbr.md` | Documentación general del simulador y de BBR |
| `prompt_ia.md` | El prompt que se usó para generar el código |
| `reflexion_cambios.md` | Este archivo — reflexión sobre los cambios hechos |
