import { AnalogMeter } from './lib/analog-meter.js';
import { HTML } from './lib/dom.js';
HTML.query('body').append(AnalogMeter.builder(640, 320).build().svg);
//# sourceMappingURL=meter.js.map