/* ------------------------------------------------------------------------
 * simulador_bbr.c
 *
 * Simulador simplificado del algoritmo de control de congestion BBR
 * (Bottleneck Bandwidth and RTT) de Google, escrito en ANSI C (C89).
 *
 * Simula, ronda a ronda (1 ronda ~ 1 RTT), las 4 fases de BBR:
 *   STARTUP    -> crecimiento exponencial para encontrar el ancho de
 *                 banda del cuello de botella (BtlBw)
 *   DRAIN      -> drena la cola generada por el sobre-impulso de STARTUP
 *   PROBE_BW   -> estado estable, cicla la ganancia de envio para sondear
 *                 mas ancho de banda periodicamente
 *   PROBE_RTT  -> reduce la ventana al minimo cada cierto tiempo para
 *                 remedir el RTT real sin cola (RTprop)
 *
 * Permite ajustar al inicio los valores iniciales de la red simulada:
 * tasa de transmision del enlace (kB/s) y el RTT base (ms).
 *
 * Al final imprime, ademas de la tabla ronda a ronda, dos graficos de
 * barras en modo texto (BtlBw y retardo de cola) a modo de "interfaz
 * grafica" dentro de las limitaciones de ANSI C puro (sin librerias
 * de ventanas/graficos, que no son parte del estandar).
 * ------------------------------------------------------------------------ */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define NUM_ROUNDS 60
#define BW_WINDOW 10          /* ventana del filtro max de BtlBw (rondas)  */
#define RTT_WINDOW 10         /* ventana del filtro min de RTprop (rondas) */
#define PROBE_RTT_INTERVAL 10 /* rondas en PROBE_BW antes de sondear RTT   */
#define PROBE_RTT_DURATION 2  /* rondas que dura PROBE_RTT                 */
#define STARTUP_GROWTH_FACTOR                                                  \
  1.25 /* crecimiento minimo (25%) para seguir en STARTUP */
#define STARTUP_NO_GROWTH_LIMIT                                                \
  3                    /* rondas sin crecer antes de pasar a DRAIN  */
#define HIGH_GAIN 2.77 /* ganancia alta ~ 2/ln(2), tipica de BBR    */
#define PROBE_BW_CYCLE_LEN 8
#define MIN_CWND_KB 4.0
#define BAR_WIDTH 40

typedef enum { STARTUP, DRAIN, PROBE_BW, PROBE_RTT } Phase;

static const double kProbeBwGains[PROBE_BW_CYCLE_LEN] = {1.25, 0.75, 1.0, 1.0,
                                                         1.0,  1.0,  1.0, 1.0};

/* --- prototipos --- */
const char *phase_name(Phase p);
double read_double_with_default(const char *prompt, double def);
void push_sample(double *arr, int size, int *count, double val);
double max_of(const double *arr, int count);
double min_of(const double *arr, int count);
void print_bar_chart(const char *title, const double *values, int n,
                     const char *unit);

int main(void) {
  /* parametros de la red (el "mundo" que el algoritmo no conoce de antemano) */
  double link_bw_kBps;
  double base_rtt_ms;
  double buffer_kB;

  /* estado estimado por BBR */
  double btlbw_kBps;
  double rtprop_ms;
  double bdp_kB;
  double pacing_rate_kBps;
  double cwnd_kB;
  double pacing_gain;
  double cwnd_gain;
  double inflight_kB;

  /* filtros deslizantes */
  double bw_history[BW_WINDOW];
  double rtt_history[RTT_WINDOW];
  int bw_count;
  int rtt_count;

  /* maquina de fases */
  Phase phase;
  int probe_bw_cycle_index;
  int rounds_in_probe_bw;
  int probe_rtt_rounds_left;
  int no_growth_rounds;
  double prev_btlbw_for_growth;

  /* variables de cada ronda */
  int rnd;
  double capacity_per_rtt_kB;
  double jitter;
  double current_rtt_ms;
  double delay_ms;
  double delivered_kB;
  double excess_kB;
  double delivery_rate;

  /* historial para los graficos finales */
  double hist_btlbw[NUM_ROUNDS];
  double hist_delay[NUM_ROUNDS];

  printf("=== Simulador de BBR (Bottleneck Bandwidth and RTT) ===\n\n");

  link_bw_kBps =
      read_double_with_default("Tasa de transmision del enlace, kB/s", 1000.0);
  base_rtt_ms =
      read_double_with_default("RTT inicial / RTT base del enlace, ms", 50.0);
  buffer_kB = 2.0 * (link_bw_kBps * base_rtt_ms / 1000.0);

  /* inicializacion del estado de BBR */
  btlbw_kBps = 0.0;
  rtprop_ms = base_rtt_ms;
  bw_count = 0;
  rtt_count = 0;
  phase = STARTUP;
  pacing_gain = HIGH_GAIN;
  cwnd_gain = HIGH_GAIN;
  probe_bw_cycle_index = 0;
  rounds_in_probe_bw = 0;
  probe_rtt_rounds_left = 0;
  no_growth_rounds = 0;
  prev_btlbw_for_growth = 0.0;
  bdp_kB = 0.0;
  cwnd_kB = MIN_CWND_KB;
  pacing_rate_kBps = link_bw_kBps;
  inflight_kB = cwnd_kB;

  srand((unsigned int)time(NULL));

  printf("\n%-4s %-9s %9s %8s %8s %8s %8s %8s\n", "Rnd", "Fase", "BtlBw",
         "RTTmin", "RTTact", "BDP", "delay", "cwnd");
  printf("%4s %9s %9s %8s %8s %8s %8s %8s\n", "", "", "(kB/s)", "(ms)", "(ms)",
         "(kB)", "(ms)", "(kB)");

  for (rnd = 1; rnd <= NUM_ROUNDS; rnd++) {

    capacity_per_rtt_kB = link_bw_kBps * (base_rtt_ms / 1000.0);
    jitter = 1.0 + (((double)(rand() % 1001) / 1000.0) - 0.5) * 0.10;

    if (inflight_kB > buffer_kB + capacity_per_rtt_kB) {
      inflight_kB = buffer_kB + capacity_per_rtt_kB;
    }

    if (inflight_kB <= capacity_per_rtt_kB * jitter) {
      delivered_kB = inflight_kB;
      current_rtt_ms = base_rtt_ms;
    } else {
      excess_kB = inflight_kB - capacity_per_rtt_kB * jitter;
      current_rtt_ms =
          base_rtt_ms + (excess_kB / (link_bw_kBps * jitter)) * 1000.0;
      delivered_kB = inflight_kB;
    }
    delay_ms = current_rtt_ms - base_rtt_ms;

    delivery_rate = delivered_kB / (current_rtt_ms / 1000.0);
    push_sample(bw_history, BW_WINDOW, &bw_count, delivery_rate);
    push_sample(rtt_history, RTT_WINDOW, &rtt_count, current_rtt_ms);

    btlbw_kBps = max_of(bw_history, bw_count);
    rtprop_ms = min_of(rtt_history, rtt_count);
    bdp_kB = btlbw_kBps * (rtprop_ms / 1000.0);

    switch (phase) {
    case STARTUP:
      pacing_gain = HIGH_GAIN;
      cwnd_gain = HIGH_GAIN;
      if (btlbw_kBps < prev_btlbw_for_growth * STARTUP_GROWTH_FACTOR) {
        no_growth_rounds++;
      } else {
        no_growth_rounds = 0;
      }
      prev_btlbw_for_growth = btlbw_kBps;
      if (no_growth_rounds >= STARTUP_NO_GROWTH_LIMIT) {
        phase = DRAIN;
      }
      break;

    case DRAIN:
      pacing_gain = 1.0 / HIGH_GAIN;
      cwnd_gain = HIGH_GAIN;
      if (inflight_kB <= bdp_kB) {
        phase = PROBE_BW;
        probe_bw_cycle_index = 0;
        rounds_in_probe_bw = 0;
      }
      break;

    case PROBE_BW:
      pacing_gain = kProbeBwGains[probe_bw_cycle_index];
      cwnd_gain = 2.0;
      probe_bw_cycle_index = (probe_bw_cycle_index + 1) % PROBE_BW_CYCLE_LEN;
      rounds_in_probe_bw++;
      if (rounds_in_probe_bw >= PROBE_RTT_INTERVAL) {
        phase = PROBE_RTT;
        probe_rtt_rounds_left = PROBE_RTT_DURATION;
        rounds_in_probe_bw = 0;
      }
      break;

    case PROBE_RTT:
      pacing_gain = 1.0;
      probe_rtt_rounds_left--;
      if (probe_rtt_rounds_left <= 0) {
        phase = PROBE_BW;
      }
      break;

    default:
      break;
    }

    if (phase == PROBE_RTT) {
      cwnd_kB = MIN_CWND_KB;
    } else {
      cwnd_kB = cwnd_gain * bdp_kB;
      if (cwnd_kB < MIN_CWND_KB) {
        cwnd_kB = MIN_CWND_KB;
      }
    }

    pacing_rate_kBps = pacing_gain * btlbw_kBps;
    if (pacing_rate_kBps <= 0.0) {
      pacing_rate_kBps = link_bw_kBps;
    }

    hist_btlbw[rnd - 1] = btlbw_kBps;
    hist_delay[rnd - 1] = delay_ms;

    printf("%-4d %-9s %9.1f %8.1f %8.1f %8.1f %8.1f %8.1f\n", rnd,
           phase_name(phase), btlbw_kBps, rtprop_ms, current_rtt_ms, bdp_kB,
           delay_ms, cwnd_kB);

    inflight_kB = cwnd_kB;
    if (pacing_rate_kBps * (base_rtt_ms / 1000.0) < inflight_kB) {
      inflight_kB = pacing_rate_kBps * (base_rtt_ms / 1000.0);
    }
  }

  printf("\nParametros finales -> BtlBw: %.1f kB/s | RTprop: %.1f ms | "
         "BDP: %.1f kB\n",
         btlbw_kBps, rtprop_ms, bdp_kB);

  print_bar_chart("BtlBw estimado por ronda", hist_btlbw, NUM_ROUNDS, "kB/s");
  print_bar_chart("Retardo de cola por ronda", hist_delay, NUM_ROUNDS, "ms");

  return 0;
}

/* Devuelve el nombre legible de una fase de BBR. */
const char *phase_name(Phase p) {
  switch (p) {
  case STARTUP:
    return "STARTUP";
  case DRAIN:
    return "DRAIN";
  case PROBE_BW:
    return "PROBE_BW";
  case PROBE_RTT:
    return "PROBE_RTT";
  default:
    return "?";
  }
}

/* Pide un numero por stdin; si el usuario solo presiona Enter (o el valor
 * no es valido), devuelve el valor por defecto 'def'.
 * Correccion: si la entrada excede el buffer (64 chars), se vacia el
 * sobrante de stdin para que no contamine la siguiente lectura. */
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

/* Empuja 'val' a un historial de tamano fijo (ventana deslizante),
 * descartando la muestra mas antigua cuando ya esta lleno. */
void push_sample(double *arr, int size, int *count, double val) {
  int i;
  if (*count < size) {
    arr[*count] = val;
    (*count)++;
  } else {
    for (i = 0; i < size - 1; i++) {
      arr[i] = arr[i + 1];
    }
    arr[size - 1] = val;
  }
}

double max_of(const double *arr, int count) {
  int i;
  double m;
  if (count == 0) {
    return 0.0;
  }
  m = arr[0];
  for (i = 1; i < count; i++) {
    if (arr[i] > m) {
      m = arr[i];
    }
  }
  return m;
}

double min_of(const double *arr, int count) {
  int i;
  double m;
  if (count == 0) {
    return 0.0;
  }
  m = arr[0];
  for (i = 1; i < count; i++) {
    if (arr[i] < m) {
      m = arr[i];
    }
  }
  return m;
}

/* Imprime un grafico de barras horizontal en modo texto: la version de
 * "interfaz grafica" posible dentro de ANSI C puro, sin librerias de
 * ventanas/graficos. */
void print_bar_chart(const char *title, const double *values, int n,
                     const char *unit) {
  int i, j, bar_len;
  double max_val;

  max_val = values[0];
  for (i = 1; i < n; i++) {
    if (values[i] > max_val) {
      max_val = values[i];
    }
  }

  printf("\n--- %s (%s) ---\n", title, unit);
  for (i = 0; i < n; i++) {
    if (max_val > 0.0) {
      bar_len = (int)((values[i] / max_val) * BAR_WIDTH);
    } else {
      bar_len = 0;
    }
    if (bar_len > BAR_WIDTH) {
      bar_len = BAR_WIDTH;
    }
    if (bar_len < 0) {
      bar_len = 0;
    }
    printf("%3d | ", i + 1);
    for (j = 0; j < bar_len; j++) {
      putchar('#');
    }
    printf(" %.1f\n", values[i]);
  }
}