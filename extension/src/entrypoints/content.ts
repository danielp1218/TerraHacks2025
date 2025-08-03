import {injectScript, storage} from '#imports'
import { styleElement, unstyleElement } from '@/utils/styling';
import './contentStyle.css'

interface ElementWithTimestamp {
  timestamp: number;
  element: Element;
}
let DEBUG = false;
storage.defineItem('local:debug', {
  fallback: false,
  init: () => {
    return false;
  }
});
storage.getItem('local:debug').then((debug) => {
  if (debug !== undefined && debug !== null) {
    handleDebugChange(debug === true);
  }
}).catch(() => {
  console.warn('Failed to get debug setting, defaulting to false.');
  handleDebugChange(false);
});

storage.watch('local:debug', (newDebug) => {
    if (newDebug !== undefined && newDebug !== null) {
        handleDebugChange(newDebug === true);
    }
});

const handleDebugChange = (debug: boolean) => {
  DEBUG = debug;
  const defaultGazeDot = document.getElementById('webgazerGazeDot'); 
  const webgazerVideoContainer = document.getElementById('webgazerVideoContainer'); 
  const gazeDot = document.getElementById('gaze-dot');
  if (debug) {
    if (defaultGazeDot) {
      defaultGazeDot.style.opacity = '1';
    }
    if (webgazerVideoContainer) {
      webgazerVideoContainer.style.display = 'block';
    }
    if (gazeDot) {
      gazeDot.style.display = 'block';
    }
  } else {
    if (defaultGazeDot) {
      defaultGazeDot.style.opacity = '0';
    }
    if (webgazerVideoContainer) {
      webgazerVideoContainer.style.display = 'none';
    }
    if (gazeDot) {
      gazeDot.style.display = 'none';
    }
  }
};

export default defineContentScript({
  matches: ['*://*.wikipedia.org/*'],
  async main(ctx) {
    
    console.log('Hello content.');
    
    // Create a dot element that will follow the gaze
    const gazeDot = document.createElement('div');
    gazeDot.className = 'gaze-dot';
    gazeDot.id = 'gaze-dot';
    document.body.appendChild(gazeDot);
    
    await injectScript('/lib/webgazer.js', {
      keepInDom: true,
    });

    await injectScript('/lib/activateWebgazer.js');
    console.log('Webgazer script loaded and activated.');
    setTimeout(() => {
    handleDebugChange(DEBUG);
    }, 2000);
    const elements: ElementWithTimestamp[] = []; // stores elements in the last 2 seconds
    
    // Variables to track eye ratio average and deviation
    let eyeRatioSum = 0;
    let eyeRatioCount = 0;
    let currentAverageEyeRatio = 0;

    let lastFiveGazeData: GazeCoordinate[] = [];
    let fiveSum = { x: 0, y: 0 };

    let focusedElements: {element: Element, style: ElementStyle}[] = [];

    let config: ExtensionConfig | null = await storage.getItem('local:appConfig');

    ctx.addEventListener(window, 'gazeData', (event: Event) => {
      if(ctx.isInvalid) {
        console.warn('Content script is invalid, ignoring gaze data event.');
        return;
      }
      const gazeEvent = event as GazeDataEvent;
      //console.log('Gaze data received:', gazeEvent.detail);

      const gazeData = gazeEvent.detail;
      const gazeX = gazeData.x;
      const gazeY = gazeData.y;

      lastFiveGazeData.push({ x: gazeX, y: gazeY });
      fiveSum.x += gazeX;
      fiveSum.y += gazeY;
      if (lastFiveGazeData.length <= 5) {
        return;
      }

      fiveSum.x -= lastFiveGazeData[0].x;
      fiveSum.y -= lastFiveGazeData[0].y;
      lastFiveGazeData.shift(); // keep only the last 5 gaze data points

      const stableGazeX = fiveSum.x / lastFiveGazeData.length; // USE THIS OVER gazeX
      const stableGazeY = fiveSum.y / lastFiveGazeData.length;
      //console.log('Stable gaze coordinates:', stableGazeX, stableGazeY);

      gazeDot.style.left = `${stableGazeX}px`;
      gazeDot.style.top = `${stableGazeY}px`;

      
      const eyeGazeData = gazeEvent.detail.eyeFeatures;
      const ratio = (eyeGazeData.left.width+eyeGazeData.right.width) / (eyeGazeData.left.height + eyeGazeData.right.height);
      
      const deviation = Math.abs(ratio - currentAverageEyeRatio);
      // Update the eye ratio average
      eyeRatioSum += ratio;
      eyeRatioCount++;
      currentAverageEyeRatio = eyeRatioSum / eyeRatioCount;

      browser.runtime.sendMessage({
        type: 'gazeData',
        data: {
          x: stableGazeX / window.innerWidth,
          y: stableGazeY / window.innerHeight,
          blink: (deviation > 0.4),
        }
      }).catch(() => {});

      const elementAtGaze = document.elementFromPoint(stableGazeX, stableGazeY);
      //console.log('Element at gaze coordinates:', elementAtGaze);
      const currentTime = Date.now();


      for (let i = elements.length - 1; i >= 0; i--) {
        if (currentTime - elements[i].timestamp > 2000) {
          elements[i].element.classList.remove('highlighted');
          elements.splice(i, 1); // remove elements older than 2 seconds
        }
      }

      if (DEBUG) {
        if (elementAtGaze && !elements.some(el => el.element === elementAtGaze)) {
          elementAtGaze.classList.add('highlighted');
          elements.push({ timestamp: currentTime, element: elementAtGaze });
        }
      }
      

      if(config == null) {
        console.warn('Config is null, cannot apply styles.');
        return;
      }

      if (elements.length <= 4) {
        for (const el of elements) {
          if (!focusedElements.some(focusedEl => focusedEl.element === el.element)) {
            const tag = el.element.tagName.toLowerCase();
            if(tag in config) {
              const configEl: ConfigElement = config[tag];
              if(el.timestamp < currentTime - (configEl.activationTime || 0) * 1000) {
                // Apply the style to the element
                styleElement(el.element as HTMLElement, configEl.style);
              }

              focusedElements.push({element: el.element, style: configEl.style});
              el.element.classList.add('focused');
            } else{
              // TODO: Call gemini to add a config for this element
              console.log("No config found for element:", tag);
            }
          }
        }
      } else {
        // Remove 'focused' class from elements that are no longer focused
        focusedElements.forEach(el => {
          if (!elements.some(e => e.element === el.element)) {
            // Add a class to trigger the transition out
            unstyleElement(el.element as HTMLElement, el.style);
            el.element.classList.add('unfocusing');

            // Remove classes after transition completes
            setTimeout(() => {
              el.element.classList.remove('unfocusing');
            }, 300); // Match the transition duration in CSS (0.3s)
          }
        });
        focusedElements = focusedElements.filter(el => elements.some(e => e.element === el.element));
      }

    }, false);
    
    storage.watch('local:appConfig', (newConfig: ExtensionConfig | null) => {
      config = newConfig;
      console.log('Config updated:', config);
    });

  },
});
