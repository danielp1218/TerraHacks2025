
if (window.webgazer) {
  window.webgazer.setRegression('ridge')
  
  window.webgazer.setGazeListener((data, clock) => {
    const event = new CustomEvent('gazeData', { 
      bubbles: true, 
      cancelable: true,
      detail: data
    });
    window.dispatchEvent(event);
  })
  .begin();
  console.log('WebGazer initialized');
}