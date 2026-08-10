import type { Mesh, Program } from 'ogl';

export interface GalleryItem {
  image: string;
  text: string;
}

export interface MediaItem {
  plane: InstanceType<typeof Mesh>;
  program: InstanceType<typeof Program>;
  x: number;
  width: number;
  widthTotal: number;
  extra: number;
  scale: number;
}
