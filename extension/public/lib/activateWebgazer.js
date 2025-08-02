
if (window.webgazer) {
  window.webgazer.setRegression('ridge')
  
  window.webgazer.setGazeListener((data, clock) => {
    console.log(data);
  })
  .begin();
  console.log('WebGazer initialized');
}