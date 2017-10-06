const map = L.map('map').setView([ -33.50115712, 151.29601339 ], 13);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
map.flyToBounds([[ -43.63, 113.34 ], [ -10.67, 153.57 ]]);

let all = [];
let features = [];
let layer = null;
let legend = null;

const hot = new Handsontable(document.getElementById('table'), {
  data: features,
  rowHeaders: true,
  colHeaders: ["id", "state", "name", "aka"],
  columns: [{
    data: 'id',
    readOnly: true,
  }, {
    data: 'properties.state',
    readOnly: true,
  }, {
    data: 'properties.name',
    readOnly: true,
  }, {
    data: 'properties.aka',
    readOnly: true,
  }],
  // minRows: 100, // causes data modification FTL
  columnSorting: {
    sortEmptyCells: false,
  },
  sortIndicator: true,
  afterSelection: afterSelection,
  contextMenu: {
    callback: function (key, options) {
      const row = hot.getSelected()[0];
      const feature = features[hot.toPhysicalRow(row)];
      const coordinates = feature.geometry.coordinates;
      if (key === 'goog') {
        window.location = 'http://www.google.com/maps/place/@' + coordinates[1] + ',' + coordinates[0] + ',13z';
      }
    },
    items: {
      'goog': {
        name: 'Visit in Google Maps',
      }
    }
  }
});

// Load the data and handle it in the future, but...
fetch('/places.json').then(r => r.json()).then(handleLoadedData);

// ... shove in some example data right now:
handleLoadedData({
  type: 'FeatureCollection',
  features: [{
    type: "Feature",
    id: "NSW4119",
    properties: {
      name: "WAGGA WAGGA",
      state: "NSW",
    },
    geometry: {
      type: "Point",
      coordinates: [
        147.35983656,
        -35.10817205
      ]
    }
  }],
});

/** Handle a freshly loaded GeoJSON FeatureCollection. */
function handleLoadedData(fc) {
  all = features = fc.features; // keep for afterSelection
  rebuildFilterTogglesControl();
  updateDisplay();
}

/** Build or rebuild the filter toggles control */
function rebuildFilterTogglesControl() {
  if (legend) {
    map.off('filtered');
    legend.remove(); // remove it
  }
  legend = L.control.filterToggles(all, [{
    name: 'State',
    labelFunction: getStateLabel,
  }, {
    name: 'UTM Zone',
    labelFunction: getZoneLabel,
  }]),
  legend.addTo(map);
  map.on('filtered', onFilter);
}

/** Handle the filter toggles control's changes */
function onFilter(event) {
  features = event.survivors;
  updateDisplay();
}

/** Update the display */
function updateDisplay() {
  hot.loadData(features);

  if (layer) {
    layer.remove(); // remove it
  }

  const fc = { type: 'FeatureCollection', features };
  layer = L.geoJSON(fc, { onEachFeature: onEachFeature });
  layer.addTo(map);
}

/** Get the state label for a feature. */
function getStateLabel(feature) {
  return feature.properties.state;
}

/** Get the zone label for a feature. */
function getZoneLabel(feature) {
  const lat = feature.geometry.coordinates[0];
  return (1 + Math.floor((lat + 180) / 6)).toFixed(0);
}

/** On each feature added to Leaflet, bind a popup. */
function onEachFeature(feature, layer) {
  const p = feature.properties;
  var parts = [p.name];
  p.aka && parts.push(p.aka);
  layer.bindPopup(parts.join(' aka '));
}

/** After selecting a row in Handsontable, fly to the row's feature */
function afterSelection(r, c, r2, c2) {
  if (r === r2 && c === c2) {
    const feature = features[hot.toPhysicalRow(r)];
    const coordinates = feature.geometry.coordinates;
    map.flyTo([ coordinates[1], coordinates[0] ], 13);
  }
}
