
if (window.webgazer) {
  window.webgazer.setRegression('ridge')
  
  window.webgazer.setGazeListener((data, clock) => {
    window.dispatchEvent(new Event('gazeData', { detail: data }));
  })
  .begin();
  console.log('WebGazer initialized');
}