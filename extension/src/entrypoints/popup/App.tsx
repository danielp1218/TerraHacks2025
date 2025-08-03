import { useState, useEffect, useRef } from 'react';

function App() {
  const eyeBallRef = useRef<HTMLDivElement>(null);
  const [isSquinting, setIsSquinting] = useState(false);
  const [issueText, setIssueText] = useState('');

  function clamp(num:number, min:number, max:number) {
    return Math.max(min, Math.min(num, max));
  }

  //change to eye tracking later
  useEffect(() => {
    const handleData = (gazeData: { x: number; y: number; blink: boolean; }) => {
      console.log('Gaze data received:', gazeData);
      // Get the gaze coordinates
      const x = clamp(gazeData.x * 100, 0, 100) + "%";
      const y = clamp(gazeData.y * 100, 0, 100) + "%";

      // Update the element's position based on the gaze coordinates
      if (eyeBallRef.current) {
        eyeBallRef.current.style.transition = "0s";
        eyeBallRef.current.style.left = x;
        eyeBallRef.current.style.top = y;
      }
      setIsSquinting(gazeData.blink);
    };

    browser.runtime.onMessage.addListener((message: { type: string; data: { x: number; y: number; blink: boolean; }; }) => {
      if (message.type === 'gazeData') {
        handleData(message.data);
      }
    });

    // Cleanup function to remove the event listener
    return () => {
      browser.runtime.onMessage.removeListener(handleData);
    };
  }, []);

  const handleSubmit = () => {
    if (issueText.trim()) {
      browser.runtime.sendMessage({
        type: 'updateUserInfo',
        data: issueText,
      });
      setIssueText('');
    }
  };


  return (
    <>
    <div id ="rounded-edge-2">
    <div id ="rounded-edge">
      <div style={{ padding: '25px' }}></div>
      <svg width="184" height="83" viewBox="0 0 184 83" fill="none" xmlns="http://www.w3.org/2000/svg"
      >

        <path d={isSquinting 
          ? "M34.5 10L6 68L49.5 73.5L94.5 75L141 73L179 68L151 10H34.5Z"
           : "M32.5 10L5 70L38.5 31.5L92.5 17L140.5 27.5L177 68L149 10H32.5Z"}
          fill="white"
          style={{ transition: 'all 0.5s ease-in-out' }}
        />
          
        <path 
          d={isSquinting 
          ? "M5 68C5 68 24.4413 74.5 91.5 74.5C158.559 74.5 178 68 178 68"
            : "M5 70C5 70 25.7542 17 92.813 17C159.872 17 178 70 178 70"
          }
           
          stroke="#97D1CE" 
          strokeWidth="11" 
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease-in-out' }}
        />

        <path d={isSquinting
        ? "M92 74.0876V62" 
        : "M92 17.0876V5"}
         stroke="#97D1CE" 
         strokeWidth="11" 
         strokeLinecap="round"
         style={{ transition: 'all 0.5s ease-in-out' }}
         />

        </svg>

      <div id="eye" style={{ zIndex:-1000 }}>
        <div id="eyeBall" ref={eyeBallRef}></div>
      </div>
      </div>
      <div style={{ padding: '20px' }}></div>
      </div>
      <div className="content"></div>
      <div style={{ padding: '5px' }}></div>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <input placeholder="Enter issue here..." type="text" id="fname" name="fname" value={issueText} onChange={(e) => setIssueText(e.target.value)}></input>
      </form>
      <div>
        <input type="submit" value="Go" style={{ marginLeft: '10px' }} onClick={handleSubmit}></input>
        <label className="switch" style={{ float: 'right', marginRight: '10px' }}>
          <input type="checkbox"></input>
          <span className="slider"></span>
        </label>
        <a style={{ float: 'right', marginRight: '10px' , marginTop: '10px', color: '#6EB9B6'}}>Debug Mode</a>
      </div>
      <div style={{ padding: '25px' }}></div>
    </>
  );
}

export default App;
