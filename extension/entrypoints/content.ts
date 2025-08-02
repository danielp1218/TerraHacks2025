import {injectScript} from '#imports'


export default defineContentScript({
  matches: ['*://*.wikipedia.org/*'],
  async main(context) {
    console.log('Hello content.');
    
    await injectScript('/lib/webgazer.js', {
      keepInDom: true,
    });
    await injectScript('/lib/activateWebgazer.js');
    console.log('Webgazer script loaded and activated.');

    window.addEventListener('gazeData', (event: Event) => {
      const gazeEvent = event as GazeDataEvent;
      console.log('Gaze data received:', gazeEvent.detail);
      
    }, false);
    
  },
});
