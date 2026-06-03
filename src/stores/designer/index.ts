
import { defineStore } from 'pinia';
import { state } from './state';
import { getters } from './getters';
import { actions } from './actions/index';

export const useDesignerStore = defineStore('designer', {
  state,
  getters,
  actions
});
