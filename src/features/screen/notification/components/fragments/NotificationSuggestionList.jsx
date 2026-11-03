const NotificationSuggestionList = ({ suggestions, getKey, renderLabel, onSelect }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="features screen notification suggestion-list">
      {suggestions.map((suggestion) => (
        <button
          key={getKey(suggestion)}
          type="button"
          className="features screen notification suggestion-item"
          onClick={() => onSelect(suggestion)}
        >
          {renderLabel(suggestion)}
        </button>
      ))}
    </div>
  );
};

export default NotificationSuggestionList;