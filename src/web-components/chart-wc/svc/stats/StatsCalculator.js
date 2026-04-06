import {formatNumber} from '../utils/Utils.js';
import {
  DEFAULT_Y_TICKS,
  DEFAULT_VALUE_TICKS,
  SCALE_BUFFER_PERCENT,
} from '../constants.js';

/**
 * Calculates information from the data to be used in scaling and plotting data
 * points.
 * @param {Array} data - The user supplied data
 * @param {Object} config - The user supplied configuration object
 * @param {string} chartType - The chart type string (e.g. 'line', 'bar')
 * @return {Object} The stats object
 * @throws {Error} If `data` is not a non-empty array.
 * @throws {Error} If any series element is missing a `values` property.
 */
export function calculateStats(data, config, chartType) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('SVC: "data" must be a non-empty array of series objects.');
  }
  for (let i = 0; i < data.length; i++) {
    if (!data[i] || data[i].values == null) {
      throw new Error(`SVC: data[${i}] must have a "values" property.`);
    }
  }

  // Validate numeric values (skip scatter/bubble which use arrays)
  if (chartType !== 'scatter' && chartType !== 'bubble') {
    for (let i = 0; i < data.length; i++) {
      const vals = data[i].values;
      const entries = Array.isArray(vals) ? vals : Object.values(vals);
      for (let j = 0; j < entries.length; j++) {
        if (entries[j] != null && typeof entries[j] !== 'number') {
          throw new Error(
            `SVC: data[${i}].values contains non-numeric value ` +
            `"${entries[j]}" at position ${j}.`,
          );
        }
      }
    }
  }

  const keyStats = {
    min: Infinity,
    max: -Infinity,
    ticks: DEFAULT_Y_TICKS,
    scale: 0,
  };

  const valueStats = {
    min: Infinity,
    max: -Infinity,
    ticks: DEFAULT_VALUE_TICKS,
    scale: 0,
  };
  const altStats = {
    min: Infinity,
    max: -Infinity,
  };

  let associative = false;

  // Obtain the interval (min, max) of x & y
  let largestSeriesLength = -Infinity;

  // Obtain the min and max of the key/value set.
  if (chartType === 'scatter' || chartType === 'bubble') {
    Object.assign(keyStats, getScatterInterval(data, 'x'));
    Object.assign(valueStats, getScatterInterval(data, 'y'));

    if (chartType === 'bubble') {
      Object.assign(altStats, getScatterInterval(data, 'size'));
    }
    // Key-value pairs
    // Test the first series if it is k/v based
  } else if (!Array.isArray(data[0].values)) {
    associative = true;
    const values = data
        .reduce((acc, series) => {
          return acc.concat(Object.keys(series.values)
              .map((key) => {
                return series.values[key];
              }));
        }, [])
        .sort((a, b) => {
          return a - b;
        });

    /*
    Length of the series. Create an array of all unique keys.
      Order will be predicated on user order in which unique keys appear unless sorting is enabled
    */
    // Squash all objects into one object, overwriting values. Then take the Object.keys
    let keys = {};
    data.forEach((series) => {
      Object.assign(keys, series.values);
    });
    keys = Object.keys(keys);
    if (config.scale.sorted) {
      keys.sort();
    }
    if (config.plot && config.plot.stacked) {
      // Stacked: compute separate positive and negative accumulations
      let maxPos = 0;
      let minNeg = 0;
      keys.forEach((key) => {
        let pos = 0;
        let neg = 0;
        data.forEach((s) => {
          const v = s.values[key] || 0;
          if (v >= 0) pos += v; else neg += v;
        });
        maxPos = Math.max(maxPos, pos);
        minNeg = Math.min(minNeg, neg);
      });
      valueStats.min = minNeg;
      valueStats.max = maxPos;
    } else {
      valueStats.min = values[0];
      valueStats.max = values[values.length - 1];
    }
    keyStats.keys = keys;
    keyStats.min = 0;
    keyStats.max = largestSeriesLength = keys.length;
  } else {
    // Min and Max of the values
    const values = data
        .reduce((acc, series) => {
          return acc.concat(series.values);
        }, [])
        .sort((a, b) => {
          return a - b;
        });
    if (config.plot && config.plot.stacked) {
      // Stacked: compute separate positive and negative accumulations
      const maxLen = Math.max(...data.map((s) => s.values.length));
      let maxPos = 0;
      let minNeg = 0;
      for (let idx = 0; idx < maxLen; idx++) {
        let pos = 0;
        let neg = 0;
        data.forEach((s) => {
          const v = s.values[idx] || 0;
          if (v >= 0) pos += v; else neg += v;
        });
        maxPos = Math.max(maxPos, pos);
        minNeg = Math.min(minNeg, neg);
      }
      valueStats.min = minNeg;
      valueStats.max = maxPos;
    } else {
      valueStats.min = values[0];
      valueStats.max = values[values.length - 1];
    }

    // Length of the series
    const firstLength = data[0].values.length;
    data.forEach((series, i) => {
      if (series.values.length !== firstLength) {
        console.warn(
          `SVC: Series ${i} has ${series.values.length} values, ` +
          `but series 0 has ${firstLength}. ` +
          'Mismatched lengths may cause unexpected results.',
        );
      }
      largestSeriesLength = (series.values.length > largestSeriesLength) ?
        series.values.length : largestSeriesLength;
    });
    keyStats.min = 0;
    keyStats.max = largestSeriesLength;
  }

  Object.assign(valueStats, calculateScale(valueStats));

  // SCALE KEY
  if (chartType === 'scatter' || chartType === 'bubble') {
    Object.assign(keyStats, calculateScale(keyStats));
  } else if (chartType === 'bar' || chartType === 'column') {
    // Try to find the best number of ticks for the dataset length
    if (largestSeriesLength > config.scale.maxItems) {
      keyStats.ticks = config.scale.maxItems;
      keyStats.step = Math.floor((largestSeriesLength) / (keyStats.ticks-1));
    } else {
      keyStats.ticks = largestSeriesLength;
      keyStats.step = 1;
    }
    keyStats.scaleLength = largestSeriesLength;
    keyStats.scaleFactor = (formatNumber(100 / (largestSeriesLength)));
  } else {
    // Try to find the best number of ticks for the dataset length
    if (largestSeriesLength > config.scale.maxItems) {
      keyStats.ticks = config.scale.maxItems;
      keyStats.step = Math.ceil((largestSeriesLength) / (keyStats.ticks-1));
    } else {
      keyStats.ticks = largestSeriesLength;
      keyStats.step = 1;
    }
    keyStats.scaleLength = largestSeriesLength;
    keyStats.scaleFactor = (formatNumber(100 / Math.max(largestSeriesLength - 1, 1)));
  }

  const isVertical = config.plot.vertical;
  return {
    associative,
    x: (isVertical) ? keyStats : valueStats,
    y: (isVertical) ? valueStats : keyStats,
    alt: altStats,
  };
}

/**
 * Calculates a scale for y, and negative x values when the dataset is non-linear
 * @param {Object} stats - contains min, max, and number of ticks
 * @return {Object} An object containing information about the scales
 */
export function calculateScale({max, min, ticks: numTicks}) {
  // Increase the max/ min by 10% for a buffer area.
  min = Math.floor(min + (min * SCALE_BUFFER_PERCENT));
  max = Math.ceil(max + (max * SCALE_BUFFER_PERCENT));
  // Force a minimum value of 0 if not negative
  min = (min > 0) ? 0 : min;

  // Calculate a nice step size that produces round tick values
  const rawInterval = max - min;
  // Guard against zero range (e.g. all-zero data)
  if (rawInterval <= 0) {
    return {min, max: min + 1, step: 1, scaleLength: 1, scaleFactor: 100, ticks: 2};
  }
  const step = niceStep(rawInterval, numTicks);

  // Snap min down and max up to step boundaries
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;

  const scaleLength = max - min;
  numTicks = Math.round(scaleLength / step) + 1;

  const scaleFactor = (100 / scaleLength);

  return {min, max, step, scaleLength, scaleFactor, ticks: numTicks};
}

/**
 * Calculate a "nice" step size for axis ticks.
 * Produces round numbers like 1, 2, 5, 10, 20, 25, 50, 100, etc.
 * @param {number} range - the data range (max - min)
 * @param {number} targetTicks - desired number of tick intervals
 * @return {number} a round step value
 */
export function niceStep(range, targetTicks) {
  const rawStep = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceRes;
  if (residual <= 1.5) niceRes = 1;
  else if (residual <= 3.5) niceRes = 2.5;
  else if (residual <= 7.5) niceRes = 5;
  else niceRes = 10;

  return niceRes * magnitude;
}

/**
 * Gets the min and max for scatter/bubble charts
 * @param {Array} data - the user supplied data
 * @param {string} axis - which axis ('x', 'y', or 'size')
 * @return {Object} contains min and max values
 */
export function getScatterInterval(data, axis) {
  let index;
  switch (axis) {
    case 'x':
      index = 0;
      break;
    case 'y':
      index = 1;
      break;
    case 'size':
      index = 2;
      break;
  }

  const values = data
      .map((series) => {
        return series.values.map((value) => {
          return value[index];
        });
      })
      .reduce((acc, arr) => {
        return acc.concat(arr);
      })
      .sort((a, b) => {
        return a - b;
      });
  return {
    min: values[0],
    max: values[values.length - 1],
  };
}
