import {injectScript} from '#imports'
import './contentStyle.css'

interface ElementWithTimestamp {
  timestamp: number;
  element: Element;
}

export default defineContentScript({
  matches: ['*://*.wikipedia.org/*'],
  async main(ctx) {
    
    console.log('Hello content.');
    
    // Create a dot element that will follow the gaze
    const gazeDot = document.createElement('div');
    gazeDot.className = 'gaze-dot';
    document.body.appendChild(gazeDot);
    
    await injectScript('/lib/webgazer.js', {
      keepInDom: true,
    });
    await injectScript('/lib/activateWebgazer.js');
    console.log('Webgazer script loaded and activated.');

    const elements: ElementWithTimestamp[] = []; // stores elements in the last 2 seconds
    
    // Variables to track eye ratio average and deviation
    let eyeRatioSum = 0;
    let eyeRatioCount = 0;
    let currentAverageEyeRatio = 0;

    let lastFiveGazeData: GazeCoordinate[] = [];
    let fiveSum = { x: 0, y: 0 };

    let focusedElements: Element[] = [];

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

      const stableGazeX = fiveSum.x / lastFiveGazeData.length;
      const stableGazeY = fiveSum.y / lastFiveGazeData.length;
      
      // Update the dot position to follow the gaze
      gazeDot.style.left = `${stableGazeX}px`;
      gazeDot.style.top = `${stableGazeY}px`;

      const elementAtGaze = document.elementFromPoint(stableGazeX, stableGazeY);
      //console.log('Element at gaze coordinates:', elementAtGaze);
      const currentTime = Date.now();

      for (let i = elements.length - 1; i >= 0; i--) {
        if (currentTime - elements[i].timestamp > 2000) {
          elements[i].element.classList.remove('highlighted');
          elements.splice(i, 1); // remove elements older than 2 seconds
        }
      }

      if (elementAtGaze && !elements.some(el => el.element === elementAtGaze)) {
        elementAtGaze.classList.add('highlighted');
        elements.push({ timestamp: currentTime, element: elementAtGaze });
      }
      
      if (elements.length == 1) {
        // If the element is not already focused, add it
        if (!focusedElements.includes(elements[0].element)) {
          focusedElements.push(elements[0].element);
          elements[0].element.classList.add('focused');
        }
      } else {
        // Remove 'focused' class from elements that are no longer focused
        focusedElements.forEach(el => {
          if (!elements.some(e => e.element === el)) {
            // Add a class to trigger the transition out
            el.classList.add('unfocusing');
            
            // Remove classes after transition completes
            setTimeout(() => {
              el.classList.remove('focused');
              el.classList.remove('unfocusing');
            }, 300); // Match the transition duration in CSS (0.3s)
          }
        });
        focusedElements = focusedElements.filter(el => elements.some(e => e.element === el));
      }

      const eyeGazeData = gazeEvent.detail.eyeFeatures;
      const ratio = (eyeGazeData.left.width+eyeGazeData.right.width) / (eyeGazeData.left.height + eyeGazeData.right.height);
      
      // Update the eye ratio average
      eyeRatioSum += ratio;
      eyeRatioCount++;
      currentAverageEyeRatio = eyeRatioSum / eyeRatioCount;
      //console.log('Current average eye ratio:', currentAverageEyeRatio);

      // Check if the ratio deviates significantly from the average
      const deviation = Math.abs(ratio - currentAverageEyeRatio);
      if (deviation > 0.1) { // threshold for significant deviation
        console.warn('Significant deviation in eye ratio detected:', deviation);
      }


    }, false);
    
  },
});
