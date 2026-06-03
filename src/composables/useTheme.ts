import { ref, computed, watch } from "vue";

const theme = ref<string>(
  localStorage.getItem("print-designer-theme") || "system",
);
const systemDark = ref(
  window.matchMedia("(prefers-color-scheme: dark)").matches,
);

const mq = window.matchMedia("(prefers-color-scheme: dark)");
mq.addEventListener?.("change", (e) => {
  systemDark.value = e.matches;
});

const isDark = computed(() => {
  if (theme.value === "dark") return true;
  if (theme.value === "light") return false;
  return systemDark.value;
});

const setTheme = (newTheme: string) => {
  theme.value = newTheme;
  localStorage.setItem("print-designer-theme", newTheme);
};

watch(
  isDark,
  (val) => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.toggle("dark", val);
    body.classList.toggle("dark", val);
    root.setAttribute("theme-mode", val ? "dark" : "");
    body.setAttribute("theme-mode", val ? "dark" : "");
  },
  { immediate: true },
);

export function useTheme() {
  return {
    theme,
    isDark,
    setTheme,
  };
}
