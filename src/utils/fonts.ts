import type { DesignerFontOption } from "@/types";

export type FontOption = DesignerFontOption;

export type FontGroup = {
  label: string;
  options: FontOption[];
};

type TranslateFn = (key: string) => string;

export const createDefaultFontGroups = (t: TranslateFn): FontGroup[] => [
  {
    label: t("editor.fontGroups.common"),
    options: [{ label: t("editor.fonts.default"), value: "" }],
  },
  {
    label: t("editor.fontGroups.chinese"),
    options: [
      {
        label: t("editor.fonts.microsoftYaHei"),
        value: '"Microsoft YaHei", "微软雅黑", sans-serif',
      },
      {
        label: t("editor.fonts.pingFangSC"),
        value: '"PingFang SC", "Microsoft YaHei", sans-serif',
      },
      { label: t("editor.fonts.simSun"), value: "SimSun, serif" },
      { label: t("editor.fonts.simHei"), value: "SimHei, sans-serif" },
      { label: t("editor.fonts.kaiTi"), value: "KaiTi, STKaiti, serif" },
      {
        label: t("editor.fonts.fangSong"),
        value: "FangSong, STFangsong, serif",
      },
      { label: t("editor.fonts.dengXian"), value: "DengXian, sans-serif" },
    ],
  },
  {
    label: t("editor.fontGroups.western"),
    options: [
      { label: t("editor.fonts.arial"), value: "Arial, sans-serif" },
      {
        label: t("editor.fonts.timesNewRoman"),
        value: '"Times New Roman", serif',
      },
      { label: t("editor.fonts.verdana"), value: "Verdana, sans-serif" },
      { label: t("editor.fonts.georgia"), value: "Georgia, serif" },
      { label: t("editor.fonts.tahoma"), value: "Tahoma, sans-serif" },
    ],
  },
  {
    label: t("editor.fontGroups.monospace"),
    options: [
      {
        label: t("editor.fonts.courierNew"),
        value: '"Courier New", monospace',
      },
    ],
  },
];

export const createFontGroups = (
  t: TranslateFn,
  fontOptions: DesignerFontOption[] | null | undefined,
): FontGroup[] => {
  const defaultFontGroups = createDefaultFontGroups(t);
  const customOptions = fontOptions || [];

  if (!customOptions.length) {
    return defaultFontGroups;
  }

  const normalizedCustom = customOptions.map((opt) => ({
    label: (opt.label || opt.value || "").trim(),
    value: opt.value,
  }));
  const customFontGroup = {
    label: t("editor.fontGroups.custom"),
    options: normalizedCustom,
  };
  const hasDefaultOption = normalizedCustom.some((opt) => opt.value === "");

  if (hasDefaultOption) {
    return [customFontGroup];
  }

  return [...defaultFontGroups, customFontGroup];
};
