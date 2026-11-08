/** One moment of Radar: when it was observed, and where its map tiles are. */
export type RadarFrame = {
  time: Date;
  /** A tile URL template with {z}, {x} and {y} placeholders. */
  tileUrl: string;
};

/** What a map needs to draw the Radar around a Location. */
export type RadarMapProps = {
  latitude: number;
  longitude: number;
  frames: RadarFrame[];
  /** The frame currently shown. */
  frameIndex: number;
};
