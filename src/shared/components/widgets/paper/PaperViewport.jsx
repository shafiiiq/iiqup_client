import './PaperViewport.css';
function PaperViewport({ left, right }) {
  if (left && right) {
    return (
      <div className="paper-viewport paper-viewport-split">
        <div className="paper-viewport-pane">{left}</div>
        <div className="paper-viewport-pane">{right}</div>
      </div>
    );
  }

  return (
    <div className="paper-viewport paper-viewport-centered">
      {left || right}
    </div>
  );
}

export default PaperViewport;