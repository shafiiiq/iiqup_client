import Card from './Card';

function CardSkeleton({ children, ...rest }) {
  return (
    <Card data-skeleton="true" {...rest}>
      {children}
    </Card>
  );
}

export default CardSkeleton;