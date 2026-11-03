import { RENDITION_ORDER, RENDITION_STATUS_READY } from './cdn.constant';

const getRenditionOrder = (renditionName) => RENDITION_ORDER.indexOf(renditionName);

export const listReadyRenditionNames = (renditions = []) =>
  renditions
    .filter((rendition) => rendition.status === RENDITION_STATUS_READY)
    .map((rendition) => rendition.name)
    .sort((firstName, secondName) => getRenditionOrder(firstName) - getRenditionOrder(secondName));

export const pickRendition = (readyRenditionNames, preferredRendition) => {
  if (readyRenditionNames.length === 0) return '';
  const notHigherThanPreferred = readyRenditionNames.filter(
    (renditionName) => getRenditionOrder(renditionName) <= getRenditionOrder(preferredRendition)
  );
  return notHigherThanPreferred.length > 0
    ? notHigherThanPreferred[notHigherThanPreferred.length - 1]
    : readyRenditionNames[0];
};