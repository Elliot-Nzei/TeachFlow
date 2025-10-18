
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// This is not used, but is here as a reference for the structure of the JSON file.
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

    