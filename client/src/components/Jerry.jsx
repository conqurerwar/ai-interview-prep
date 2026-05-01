import './Jerry.css';

export default function Jerry({ isSpeaking }) {
  return (
    <div className="jerry-container">
      <div className={`jerry-avatar ${isSpeaking ? 'speaking' : ''}`}>
        <div className="jerry-head">
          <div className="jerry-hair"></div>
          <div className="jerry-eyes">
            <div className="eye left"></div>
            <div className="eye right"></div>
          </div>
          <div className={`jerry-mouth ${isSpeaking ? 'animate-mouth' : ''}`}></div>
        </div>
        <div className="jerry-body">
          <div className="tie"></div>
        </div>
      </div>
    </div>
  );
}
