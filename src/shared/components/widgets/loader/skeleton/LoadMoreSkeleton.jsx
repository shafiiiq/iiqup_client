function LoadMoreSkeleton({ count, renderItem }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`load-more-skeleton-${index}`}>{renderItem(index)}</div>
      ))}
    </>
  );
}

export default LoadMoreSkeleton;