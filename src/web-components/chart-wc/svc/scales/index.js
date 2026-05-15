import {registerScale, createScale} from './ScaleRegistry.js';
import { LinearScale } from './LinearScale.js';
import { CategoryScale } from './CategoryScale.js';
import { LogScale } from './LogScale.js';
import { TimeScale } from './TimeScale.js';

// Register built-in scale types
registerScale('linear', LinearScale);
registerScale('category', CategoryScale);
registerScale('log', LogScale);
registerScale('time', TimeScale);

export {registerScale, createScale};
