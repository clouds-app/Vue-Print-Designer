// @ts-nocheck
import { defineStore } from "pinia";
import { uuidv4 } from "@/utils/uuid";
import cloneDeep from "lodash/cloneDeep";
import {
  type DesignerState,
  type PrintElement,
  type TableColumn,
  type Page,
  type Guide,
  ElementType,
  type CustomElementTemplate,
  type WatermarkSettings,
  type CustomElementEditSnapshot,
  type BrandingSettings,
  type DesignerFontOption,
  type ListContextMenuConfig,
  type ListContextMenuItem,
  type TemplateModalFormConfig,
  type TemplateModalField,
} from "@/types";
import {
  getCrudConfig,
  buildEndpoint,
  buildFetchOptions,
} from "../../../utils/crudConfig";
import { toast } from "../../../utils/toast";
import {
  canCopyEntity,
  canDeleteEntity,
  canEditEntity,
  normalizeEntityConstraints,
  applyModalExtraValues,
  mergeExt,
} from "../../../utils/entityConstraints";
import { useTemplateStore } from "../../templates";
import { normalizeVariableKey } from "../../../utils/variables";
import i18n from "../../../locales";
import { defaultWatermark, defaultBranding, HISTORY_ACTION, hasOwn, inferElementUpdateHistoryAction, loadWatermark, loadDeveloperMode, loadPaginationDebugLogs, loadRenderDebugLogs, loadTextQuickToolbarEnabled, loadStatusBarVisible, getElementZIndex, getLayerSortedElements, buildLayerAssignments, canLayerMoveInPage, normalizeContextMenuConfig, normalizeTemplateModalFields, normalizeTemplateModalFormConfig, inferVariableFromContent, normalizeDesignerFontOptions, getEffectiveTableColumns, getNumericCellStyleHeight, getTableRowExplicitHeight, isHeaderFooterLineStyle, normalizeHeaderFooterLineStyle, normalizeHeaderFooterLineColor, normalizeHeaderFooterLineWidth, normalizeHeaderFooterLineSpanMode, normalizeHeaderFooterLineSpan, normalizeHeaderFooterLineRenderingEnabled, escapeAttributeSelectorValue, getCellBorderInsetRect, querySelectorAcrossDocumentAndShadowRoots } from '../helpers';
import type { LayerMoveMode, HeaderFooterLineStyle, HeaderFooterLineSpanMode, EmbeddedCellBounds, EffectiveTableRows } from '../helpers';

export const historyActions = {
  setShowHistoryPanel(show: boolean) {
      this.showHistoryPanel = show;
    },

  undo() {
      if (this.historyPast.length === 0) return;
      const prev = this.historyPast.pop()!;
      const actionKey =
        this.historyPastActionKeys.pop() || HISTORY_ACTION.UNKNOWN;
      this.historyFuture.push(cloneDeep(this.pages));
      this.historyFutureActionKeys.push(actionKey);
      this.pages = cloneDeep(prev);
      // Ensure selected element indices still valid
      if (this.selectedElementId) {
        const exists = this.pages.some((p) =>
          p.elements.some((e) => e.id === this.selectedElementId),
        );
        if (!exists) {
          this.selectedElementId = null;
          this.selectedElementIds = [];
        }
      }
      // Validate multi-selection
      this.selectedElementIds = this.selectedElementIds.filter((id) =>
        this.pages.some((p) => p.elements.some((e) => e.id === id)),
      );
      if (this.currentPageIndex >= this.pages.length) {
        this.currentPageIndex = Math.max(0, this.pages.length - 1);
      }
    },

  redo() {
      if (this.historyFuture.length === 0) return;
      const next = this.historyFuture.pop()!;
      const actionKey =
        this.historyFutureActionKeys.pop() || HISTORY_ACTION.UNKNOWN;
      this.historyPast.push(cloneDeep(this.pages));
      this.historyPastActionKeys.push(actionKey);
      this.pages = cloneDeep(next);
      if (this.currentPageIndex >= this.pages.length) {
        this.currentPageIndex = Math.max(0, this.pages.length - 1);
      }
    }
};
