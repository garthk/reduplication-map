/**
 * @typedef {Object} FilterDefinition
 * @property {string} name - the filter's name
 * @property {function(any): string} labelFunction -
 * the filter's label function
 *
 * A filter definition for `Control.FilterToggles`.
 */

/**
 * @class Control.FilterToggles
 * @aka L.Control.FilterToggles
 * @inherits Control
 *
 * The legend filter control gives users the ability to filter an array
 * by toggling filters with labels derived from the array's members.
 * You can then replace layers and update tables from the filtered results.
 *
 * If your data naturally fits in layers, use `Control.Layers`, instead. Use
 * `Control.FilterToggles` when:
 *
 * - Features belong to multiple filterable groups, or
 *
 * - You need the filter results for another purpose, e.g. display in
 *   a table
 *
 * After adding this control, the map will fire a `filtered` event with
 * surviving array members as its argument. You're in charge of adding and
 * replacing your own feature layers.
 */
L.Control.FilterToggles = L.Control.extend({
	// @section
	// @aka L.Control.FilterToggles options
  options: {
    position: 'topright',
    interactive: true,
  },

  /**
   * Initialize the control
   *
   * @param {any[]} array - The array to filter
   * @param {FilterDefinition[]} filters - How to filter the array
   * @param {any} options -
   */
  initialize: function initialize(array, filters, options) {
    this.array = this.filtered = array;
    this.filters = filters.map(this._initFilter.bind(this));
    L.Util.setOptions(this, options);
  },

  /**
   * Configure the control for one filter
   *
   * @param {FilterDefinition} filter - How to filter the features
   * @returns {ActiveFilterDefinition}
   */
  _initFilter: function _initFilter(filter) {
    const labelFunction = filter.labelFunction;
    const name = filter.name || labelFunction.name;
    const buckets = {};
    const elements = {};

    for (let idx=0; idx<this.array.length; idx++) {
      const label = labelFunction(this.array[idx]);
      if (buckets[label]) {
        buckets[label].push(idx);
      } else {
        buckets[label] = [idx];
        elements[label] = null;
      }
    }

    const state = new ToggleGroup(Object.keys(buckets));

    return {
      name,
      labelFunction,
      buckets,
      state,
      elements,
    };
  },

  _labels: function _labels(filter) {
    const labels = Object.keys(filter.buckets);
    labels.sort();
    return labels;
  },

  onAdd: function onAdd(map) {
    const container = this._container = L.DomUtil.create('div', 'leaflet-control-filter-toggles');
    for (let idx=0; idx<this.filters.length; idx++) {
      const filter = this.filters[idx];
      const insulation = L.DomUtil.create('div', '', container);
      const bar = L.DomUtil.create('div', 'leaflet-bar', insulation);

      for (let label of this._labels(filter)) {
        const link = L.DomUtil.create('a', 'leaflet-touch leaflet-control-filter-toggles-active', bar);
        filter.elements[label] = link;
        link.innerText = label;
        link.title = `Filter by ${filter.name}: ${label}`;
        link.setAttribute('role', 'button');
        link.setAttribute('aria-label', label);
        L.DomEvent.disableClickPropagation(link);
        L.DomEvent.on(link, 'click', this._onClick.bind(this, filter, label));
        L.DomEvent.on(link, 'click', this._refocusOnMap, this);
      }
    }

    return container;
  },

  _onRemove: function _onRemove() {
    for (let filter of this.filters) {
      for (let label in filter.elements) {
        filter.elements[label] = null;
      }
    }
  },

  /**
   * Handle a user click.
   *
   * @param {ActiveFilterDefinition} filter
   * @param {string} label
   * @param {MouseEvent} event
   */
  _onClick: function _onClick(filter, label, event) {
    L.DomEvent.stop(event);
    const shifted = event.shiftKey;
    this._adjustState(filter, label, shifted);
    this.filtered = this._getSurvivors();
    this._map.fire('filtered', { survivors: this.filtered });
  },

  /**
   * Adjust state to reflect a click.
   *
   * @param {ActiveFilterDefinition} filter
   * @param {string} label
   * @param {boolean} shifted
   */
  _adjustState: function _adjustState(filter, label, shifted) {
    if (shifted) {
      return filter.state.flip(label, changed);
    } else {
      return filter.state.choose(label, changed);
    }

    function changed(l, v) {
      if (v) {
        L.DomUtil.addClass(filter.elements[l], 'leaflet-control-filter-toggles-active');
      } else {
        L.DomUtil.removeClass(filter.elements[l], 'leaflet-control-filter-toggles-active');
      }
    }
  },

  /**
   * Determine the survivors of the filters. Would be only a few lines
   * long if we weren't trying not to re-run the label functions, which
   * might be expensive.
   */
  _getSurvivors: function _getSurvivors() {
    const indicess = this.filters.map(getFilterSurvivors);
    const array = this.array;
    return indicess.reduce(both, indicess.shift()).map(get);

    function getFilterSurvivors(filter) {
      return Object.keys(filter.buckets)
                   .reduce(addLabelSurvivors, [])
                   .sort(function(a, b) { return a - b; });

      function addLabelSurvivors(previously, label) {
        if (filter.state.enabled[label]) {
          return previously.concat(filter.buckets[label]);
        } else {
          return previously;
        }
      }
    }

    function both(indices, previous) {
      let p = 0;
      return indices.filter(present);

      function present(index) {
        while (previous[p] < index) {
          p++;
          if (p >= previous.length) {
            return false;
          }
        }
        return previous[p] === index;
      }
    }

    function get(idx) {
      return array[idx];
    }
  }
});

/** Create a `L.Control.FilterToggles` control */
L.control.filterToggles = function(all, filters, options) {
  return new L.Control.FilterToggles(features, filters, options);
}

/** A group of toggles. */
class ToggleGroup {
  /** A group of toggles. */
  constructor(labels) {
    const enabled = this.enabled = {};
    for (let label of labels) {
      this.enabled[label] = true;
    }
  }

  /**
   * Flip one label.
   *
   * @param {any} label - the label to flip
   * @param {any} changed - handler function taking (label, newValue)
   */
  flip(label, changed) {
    if (!(label in this.enabled)) {
      throw new Error(`bad label ${label}`);
    }
    this.enabled[label] = !this.enabled[label];
    if (changed) {
      changed(label, this.enabled[label]);
    }
  }

  /**
   * Choose one label. Choosing it again will choose all labels.
   *
   * @param {any} label - the label to choose
   * @param {any} changed - handler function taking (label, newValue)
   */
  choose(label, changed) {
    if (!(label in this.enabled)) {
      throw new Error(`bad label ${label}`);
    }

    const enabled = this.enabled;
    const labels = Object.keys(enabled);
    const activeLabels = labels.filter(label => enabled[label]);

    switch (activeLabels.length) {
      case 1:
        const current = activeLabels[0];
        if (label === current) {
          labels.forEach(l => set(l, true));

        } else {
          set(current, false);
          set(label, true);
        }
        return;

      case 0:
        set(label, true);
        return;

      default:
        for (let l of labels) {
          set(l, l === label);
        }
        return;
    }

    function set(label, value) {
      if (enabled[label] !== value) {
        enabled[label] = value;
        if (changed) {
          changed(label, value);
        }
      }
    }
  }
}
