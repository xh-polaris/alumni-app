import { computed, onUnmounted, ref } from "vue";

export const useCountdown = (duration = 60) => {
  const seconds = ref(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  const isRunning = computed(() => seconds.value > 0);

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
    seconds.value = 0;
  };

  const start = () => {
    if (timer) clearInterval(timer);
    seconds.value = duration;
    timer = setInterval(() => {
      seconds.value -= 1;
      if (seconds.value <= 0) stop();
    }, 1000);
  };

  onUnmounted(stop);

  return {
    seconds,
    isRunning,
    start,
    stop,
  };
};
