
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

  const defaultGazeDot = document.getElementById('webgazerGazeDot'); 
  if (defaultGazeDot) {
    //defaultGazeDot.remove();
  } else{
    console.warn('Default gaze dot not found, proceeding without it.');
  }

  console.log('WebGazer initialized');
}